// @flow

import { Constants } from 'expo-constants';
import qs from 'qs';

import Linking from './Linking';
import WebBrowser from './WebBrowser';

type AuthSessionOptions = {
  authUrl: string,
  returnUrl?: string,
};

type AuthSessionResult =
  | { type: 'cancel' | 'dismiss' | 'locked' }
  | {
      type: 'error' | 'success',
      errorCode: ?string,
      params: Object,
      url: string,
    };

const BASE_URL = `https://auth.expo.io`;
let _authLock = false;

async function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult> {
  const returnUrl = options.returnUrl || getDefaultReturnUrl();
  const authUrl = options.authUrl;
  const startUrl = getStartUrl(authUrl, returnUrl);

  // Prevent accidentally starting to an empty url
  if (!authUrl) {
    throw new Error(
      'No authUrl provided to AuthSession.startAsync. An authUrl is required -- it points to the page where the user will be able to sign in.'
    );
  }

  // Prevent multiple sessions from running at the same time, WebBrowser doesn't
  // support it this makes the behavior predictable.
  if (_authLock) {
    if (__DEV__) {
      console.warn(
        'Attempted to call AuthSession.startAsync multiple times while already active. Only one AuthSession can be active at any given time'
      );
    }

    return { type: 'locked' };
  }

  // About to start session, set lock
  _authLock = true;

  let result;
  try {
    result = await _openWebBrowserAsync(startUrl, returnUrl);
  } finally {
    // WebBrowser session complete, unset lock
    _authLock = false;
  }

  // Handle failures
  if (!result) {
    throw new Error('Unexpected missing AuthSession result');
  }
  if (!result.url) {
    if (result.type) {
      return result;
    } else {
      throw new Error('Unexpected AuthSession result with missing type');
    }
  }

  let { params, errorCode } = parseUrl(result.url);

  return {
    type: errorCode ? 'error' : 'success',
    params,
    errorCode,
    url: result.url,
  };
}

function dismiss() {
  WebBrowser.dismissAuthSession();
}

async function _openWebBrowserAsync(startUrl, returnUrl) {
  // $FlowIssue: Flow thinks the awaited result can be a promise
  let result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { type: result.type };
  }

  return result;
}

function getStartUrl(authUrl: string, returnUrl: string): string {
  let queryString = qs.stringify({
    authUrl,
    returnUrl,
  });

  return `${getRedirectUrl()}/start?${queryString}`;
}

function getRedirectUrl(): string {
  const redirectUrl = `${BASE_URL}/${Constants.manifest.id}`;
  if (__DEV__) {
    _warnIfAnonymous(Constants.manifest.id, redirectUrl);
  }
  return redirectUrl;
}

function getDefaultReturnUrl(): string {
  return Linking.makeUrl('expo-auth-session');
}

function parseUrl(url: string): { errorCode: ?string, params: Object } {
  let parts = url.split('#');
  let hash = parts[1];
  let partsWithoutHash = parts[0].split('?');
  let queryString = partsWithoutHash[partsWithoutHash.length - 1];

  // Get query string (?hello=world)
  let parsedSearch = qs.parse(queryString);

  // Pull errorCode off of params
  let { errorCode } = parsedSearch;
  delete parsedSearch.errorCode;

  // Get hash (#abc=example)
  let parsedHash = {};
  if (parts[1]) {
    parsedHash = qs.parse(hash);
  }

  // Merge search and hash
  let params = {
    ...parsedSearch,
    ...parsedHash,
  };

  return {
    errorCode,
    params,
  };
}

function _warnIfAnonymous(id, url): void {
  if (id.startsWith('@anonymous/')) {
    console.warn(
      `You are not currently signed in to Expo on your development machine. As a result, the redirect URL for AuthSession will be "${url}". If you are using an OAuth provider that requires whitelisting redirect URLs, we recommend that you do not whitelist this URL -- instead, you should sign in to Expo to acquired a unique redirect URL. Additionally, if you do decide to publish this app using Expo, you will need to register an account to do it.`
    );
  }
}

export default {
  dismiss,
  getRedirectUrl,
  getStartUrl,
  getDefaultReturnUrl,
  get getRedirectUri() {
    console.warn(
      'Use AuthSession.getRedirectUrl rather than AuthSession.getRedirectUri (Url instead of Uri)'
    );
    return getRedirectUrl;
  },
  startAsync,
};
