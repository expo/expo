// @flow

import invariant from 'invariant';
import { Linking, NativeModules, Platform } from 'react-native';

const { ExponentWebBrowser } = NativeModules;

type RedirectEvent = {
  url: 'string',
};

type BrowserResult = {
  type: 'cancel' | 'dismiss',
};

async function openBrowserAsync(url: string): Promise<{ type: 'cancel' | 'dismiss' }> {
  return ExponentWebBrowser.openBrowserAsync(url);
}

function dismissBrowser(): void {
  ExponentWebBrowser.dismissBrowser();
}

type AuthSessionResult = RedirectResult | BrowserResult;

async function openAuthSessionAsync(url: string, redirectUrl: string): Promise<AuthSessionResult> {
  if (_authSessionIsNativelySupported()) {
    return ExponentWebBrowser.openAuthSessionAsync(url, redirectUrl);
  } else {
    return _openAuthSessionPolyfillAsync(url, redirectUrl);
  }
}

function dismissAuthSession(): void {
  if (_authSessionIsNativelySupported()) {
    ExponentWebBrowser.dismissAuthSession();
  } else {
    ExponentWebBrowser.dismissBrowser();
  }
}

/* iOS <= 10 and Android polyfill for SFAuthenticationSession flow */

function _authSessionIsNativelySupported() {
  if (Platform.OS === 'android') {
    return false;
  }

  const versionNumber = parseInt(Platform.Version, 10);
  return versionNumber >= 11;
}

let _redirectHandler: ?(event: RedirectEvent) => void;

async function _openAuthSessionPolyfillAsync(
  startUrl: string,
  returnUrl: string
): Promise<AuthSessionResult> {
  invariant(
    !_redirectHandler,
    'WebBrowser.openAuthSessionAsync is in a bad state. _redirectHandler is defined when it should not be.'
  );

  try {
    return await Promise.race([openBrowserAsync(startUrl), _waitForRedirectAsync(returnUrl)]);
  } finally {
    dismissBrowser();
    Linking.removeEventListener('url', _redirectHandler);
    _redirectHandler = null;
  }
}

type RedirectResult = {
  type: 'success',
  url: string,
};

function _waitForRedirectAsync(returnUrl: string): Promise<RedirectResult> {
  return new Promise(resolve => {
    _redirectHandler = (event: RedirectEvent) => {
      if (event.url.startsWith(returnUrl)) {
        resolve({ url: event.url, type: 'success' });
      }
    };

    Linking.addEventListener('url', _redirectHandler);
  });
}

export default {
  openBrowserAsync,
  openAuthSessionAsync,
  dismissBrowser,
  dismissAuthSession,
};
