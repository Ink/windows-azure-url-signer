##Windows Azure url signer

Module to sign urls to allow access to the private blobs in windows azure 

###To install

    npm install windows-azure-url-signer

###Use example

    var sig= require('windows-azure-url-signer');

    var account1 = sig.urlSigner('myaccount', 'secret_key');
    var account2 = sig.urlSigner('myaccount2', 'secret_key_2');
    
    var url1 = account1.getUrl('GET', 'mycontainer', 'somefile.png', 10); //url expires in 10 minutes
    var url2 = account2.getUrl('PUT', 'mycontaineronotheraccount', '/somedir/somefile.png', 1); //url expires in 1 minute
    var delete_url = account1.getUrl('DELETE', 'mycontainer', 'somefile.png', 10); //Deletes work too

    //Works with containers too!
    var url2 = account1.getUrl('GET', 'mycontainer', null, 10);

###Usage Notes

* Azure has a policy where signatures can only be valid for at most an hour (60 minutes). This is annoying, but it's the rules. getUrl will throw an exception if you try to do this.
* The source code is reasonably short and resonably commented, so read it if you have questions

###Credits

Inspired by and derived from [amazon-s3-url-signer](https://github.com/dyashkir/amazon-s3-url-signer).

###License

BSD, because that's what amazon-s3-url-signer is
