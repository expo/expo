/*
window.fbAsyncInit = function() {
  FB.init({
    appId            : 'your-app-id',
    autoLogAppEvents : true,
    xfbml            : true,
    version          : 'v3.2'
  });
};

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
*/

export default {
  get name(): string {
    return 'ExponentFacebook';
  },
};
