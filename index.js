var crypto = require('crypto');

//The most concise and direct discussion of how to create signed urls is at
//http://msdn.microsoft.com/en-us/library/windowsazure/dn140255.aspx
exports.urlSigner = function(account, secret, options){
    options = options || {};
    var version = options.version || '2012-02-12';
    //Most of the azure docs have this, where they explicitly set the start time back 5 minutes to account for server time drift.
    //Uglier logic so that you can set startOffset = 0
    var startOffset = parseInt(options.startOffset, 10);
    startOffset = isNaN(startOffset) ? -5 : startOffset;

    var endpoint = options.host || 'blob.core.windows.net';
    var port = options.port || '80';
    var protocol = options.protocol || 'http';

    var hmacSha256 = function (message) {
        //Nowhere in the docs does it say you need to base64 decode the secret, but apparently you do
        decodedSecret = new Buffer(secret, 'base64');
        return crypto.createHmac('sha256', decodedSecret).update(message, 'utf-8').digest('base64');
    };

    var constructUrl = function (container, path) {
        var url = protocol + '://'+ account + "." + endpoint + (port != 80 ? ':' + port : '') +
            '/' + container;

        if (path) {
            url += (path[0] === '/'?'':'/') + path;
        }

        return url;
    };

    return {
        getUrl : function(verb, container, path, expiresInMinutes){
            //No path? You must be talking about the container then
            var resource = !!path ? "b" : "c";
            //Defaults
            var permission = resource == "b" ? "r" : "rl";

            if (verb == "GET" || verb == "HEAD") {
                //for clarity
                permission = resource == "b" ? "r" : "rl";
            } else if (verb == "POST" || verb == "PUT") {
                permission = "w";
            } else if (verb == "DELETE") {
                permission = "d";
            }

            var starts = new Date();
            var expires = new Date();
            console.log(starts);

            //Date automagically wraps negatives and things over 60. Very convenient
            starts.setMinutes(starts.getMinutes() + startOffset);
            console.log(startOffset);
            expires.setMinutes(expires.getMinutes() + expiresInMinutes);

            //Azure only allows expiries of < 60 minutes when done like this. Annoying
            if (expires - starts > 1000 * 60 * 60) {
                throw "Azure doesn't allow the difference between start and expiry times to be 60 minutes";
            }

            var startTime = toAzureISOString(starts);
            var expireTime = toAzureISOString(expires);

            var uri = "/" + account + "/" + container;
            if (path) {
                uri += (path[0] === '/'?'':'/') + path;
            }

            var stringToSign = permission + "\n" + startTime + "\n" + expireTime + "\n" + uri + "\n\n" + version;
            console.log("s2s", stringToSign);

            var hashed = hmacSha256(stringToSign);

            var urlRet = constructUrl(container, path) +
                '?sv=' + version +
                '&sr=' + resource +
                '&sp=' + permission +
                '&st=' + encodeURIComponent(startTime) +
                '&se=' + encodeURIComponent(expireTime) +
                '&sig=' + encodeURIComponent(hashed);

            return urlRet;

        }
    };

};

//[Rant about Microsoft and standards]
function toAzureISOString(date) {
    function pad(number) {
        var r = String(number);
        if ( r.length === 1 ) {
            r = '0' + r;
        }
        return r;
    }

    return date.getUTCFullYear() +
        '-' + pad( date.getUTCMonth() + 1 ) +
        '-' + pad( date.getUTCDate() ) + 
        'T' + pad( date.getUTCHours() ) +
        ':' + pad( date.getUTCMinutes() ) +
        ':' + pad( date.getUTCSeconds() ) + 
        //Azure doesn't like milliseconds
        //'.' + String( (date.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 ) + 
        'Z';
}
