import { NativeModules, AppState, Linking } from 'react-native';

const DevMenu = NativeModules.ExpoDevMenuInternal;

let _redirectHandler: ((event: any) => void) | null = null;
let _onWebBrowserCloseAndroid: null | (() => void) = null;
let _isAppStateAvailable: boolean = AppState.currentState !== null;

function _onAppStateChangeAndroid(state: any) {
  if (!_isAppStateAvailable) {
    _isAppStateAvailable = true;
    return;
  }

  if (state === 'active' && _onWebBrowserCloseAndroid) {
    _onWebBrowserCloseAndroid();
  }
}

function _stopWaitingForRedirect() {
  if (!_redirectHandler) {
    throw new Error(
      `The WebBrowser auth session is in an invalid state with no redirect handler when one should be set`
    );
  }

  Linking.removeEventListener('url', _redirectHandler);
  _redirectHandler = null;
}

async function _openBrowserAndWaitAndroidAsync(startUrl: string): Promise<any> {
  const appStateChangedToActive = new Promise(resolve => {
    _onWebBrowserCloseAndroid = resolve;
    AppState.addEventListener('change', _onAppStateChangeAndroid);
  });

  let result = { type: 'cancel' };
  await DevMenu.openWebBrowserAsync(startUrl);
  const type = 'opened';

  if (type === 'opened') {
    await appStateChangedToActive;
    result = { type: 'dissmiss' };
  }

  AppState.removeEventListener('change', _onAppStateChangeAndroid);
  _onWebBrowserCloseAndroid = null;
  return result;
}

function _waitForRedirectAsync(returnUrl: string): Promise<any> {
  return new Promise(resolve => {
    _redirectHandler = (event: any) => {
      if (event.url.startsWith(returnUrl)) {
        resolve({ url: event.url, type: 'success' });
      }
    };

    Linking.addEventListener('url', _redirectHandler);
  });
}

async function _openAuthSessionPolyfillAsync(startUrl: string, returnUrl: string): Promise<any> {
  if (_redirectHandler) {
    throw new Error(
      `The WebBrowser's auth session is in an invalid state with a redirect handler set when it should not be`
    );
  }

  if (_onWebBrowserCloseAndroid) {
    throw new Error(`WebBrowser is already open, only one can be open at a time`);
  }

  try {
    return await Promise.race([
      _openBrowserAndWaitAndroidAsync(startUrl),
      _waitForRedirectAsync(returnUrl),
    ]);
  } finally {
    _stopWaitingForRedirect();
  }
}

export async function openAuthSessionAsync(url: string, returnUrl: string): Promise<any> {
  if (DevMenu.openAuthSessionAsync) {
    // iOS
    return await DevMenu.openAuthSessionAsync(url, returnUrl);
  }
  // Android
  return await _openAuthSessionPolyfillAsync(url, returnUrl);
}
