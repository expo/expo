import Constants from 'expo-constants';
import qs from 'qs';

const { manifest } = Constants;

let _getDefaultReturnUrl: () => string;
let _getStartUrl: (authUrl: string, returnUrl: string) => string;
let _getRedirectUrl: () => string;

if (manifest) {
  const BASE_URL = `https://auth.expo.io`;
  const SESSION_PATH = 'expo-auth-session';
  const USES_CUSTOM_SCHEME = Constants.appOwnership === 'standalone' && manifest.scheme;
  let HOST_URI = manifest.hostUri;
  if (!HOST_URI && !USES_CUSTOM_SCHEME) {
    // we're probably not using up-to-date xdl, so just fake it for now
    // we have to remove the /--/ on the end since this will be inserted again later
    HOST_URI = _removeScheme(Constants.linkingUri).replace(/\/--($|\/.*$)/, '');
  }

  const IS_EXPO_HOSTED =
    HOST_URI &&
    (/^(.*\.)?(expo\.io|exp\.host|exp\.direct|expo\.test)(:.*)?(\/.*)?$/.test(HOST_URI) ||
      manifest.developer);

  _getDefaultReturnUrl = (): string => {
    let scheme = 'exp';
    let path = SESSION_PATH;
    let manifestScheme = manifest.scheme || (manifest.detach && manifest.detach.scheme);

    if (Constants.appOwnership === 'standalone' && manifestScheme) {
      scheme = manifestScheme;
    } else if (Constants.appOwnership === 'standalone' && !manifestScheme) {
      throw new Error(
        'Cannot make a deep link into a standalone app with no custom scheme defined'
      );
    } else if (Constants.appOwnership === 'expo' && !manifestScheme) {
      console.warn(
        'Linking requires that you provide a `scheme` in app.json for standalone apps - if it is left blank, your app may crash. The scheme does not apply to development in the Expo client but you should add it as soon as you start working with Linking to avoid creating a broken build. Add a `scheme` to silence this warning. Learn more about Linking at https://docs.expo.io/versions/latest/workflow/linking/'
      );
    }

    let hostUri = HOST_URI || '';
    if (USES_CUSTOM_SCHEME && IS_EXPO_HOSTED) {
      hostUri = '';
    }

    if (path) {
      if (IS_EXPO_HOSTED && hostUri) {
        path = `/--/${_removeLeadingSlash(path)}`;
      }

      if (!path.startsWith('/')) {
        path = `/${path}`;
      }
    } else {
      path = '';
    }

    hostUri = _removeTrailingSlash(hostUri);

    return encodeURI(`${scheme}://${hostUri}${path}`);
  };

  _getRedirectUrl = (): string => {
    const redirectUrl = `${BASE_URL}/${Constants.manifest.id}`;
    if (__DEV__) {
      _warnIfAnonymous(Constants.manifest.id, redirectUrl);
    }
    return redirectUrl;
  };

  _getStartUrl = (authUrl: string, returnUrl: string): string => {
    let queryString = qs.stringify({
      authUrl,
      returnUrl,
    });

    return `${_getRedirectUrl()}/start?${queryString}`;
  };
} else {
  _getDefaultReturnUrl = (): string => {
    throw new Error('You are using bare flow which does not support `default return url`.');
  };

  _getStartUrl = (authUrl: string): string => {
    return authUrl;
  };

  _getRedirectUrl = () => {
    throw new Error('You need to specify the redirect url.');
  };
}

export const getDefaultReturnUrl = _getDefaultReturnUrl;
export const getStartUrl = _getStartUrl;
export const getRedirectUrl = _getRedirectUrl;

function _removeScheme(url: string) {
  return url.replace(/^[a-zA-Z0-9+.-]+:\/\//, '');
}

function _removeLeadingSlash(url: string) {
  return url.replace(/^\//, '');
}

function _removeTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

function _warnIfAnonymous(id, url): void {
  if (id.startsWith('@anonymous/')) {
    console.warn(
      `You are not currently signed in to Expo on your development machine. As a result, the redirect URL for AuthSession will be "${url}". If you are using an OAuth provider that requires whitelisting redirect URLs, we recommend that you do not whitelist this URL -- instead, you should sign in to Expo to acquired a unique redirect URL. Additionally, if you do decide to publish this app using Expo, you will need to register an account to do it.`
    );
  }
}
