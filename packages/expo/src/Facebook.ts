import { NativeModules } from 'react-native';
import UnsupportedError from './UnsupportedError';

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

const {
  ExponentFacebook = {
    get name() {
      return 'ExponentFacebook';
    },
  },
} = NativeModules;

type FacebookLoginResult = {
  type: string;
  token?: string;
  expires?: number;
};

type FacebookOptions = {
  permissions?: string[];
  behavior?: 'web' | 'native' | 'browser' | 'system';
};

export async function logInWithReadPermissionsAsync(
  appId: string,
  options?: FacebookOptions
): Promise<FacebookLoginResult> {
  if (!ExponentFacebook.logInWithReadPermissionsAsync) {
    throw new UnsupportedError('Facebook', 'logInWithReadPermissionsAsync');
  }
  if (typeof appId !== 'string') {
    console.warn(
      `logInWithReadPermissionsAsync: parameter 'appId' must be a string, was '${typeof appId}''.`
    );
    appId = String(appId);
  }

  if (!options || typeof options !== 'object') {
    options = {};
  }
  return ExponentFacebook.logInWithReadPermissionsAsync(appId, options);
}
