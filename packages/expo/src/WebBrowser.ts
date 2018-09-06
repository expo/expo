import { Linking, NativeModules, Platform } from 'react-native';

const { ExponentWebBrowser } = NativeModules;

type RedirectEvent = {
  url: string;
};

type AuthSessionResult = RedirectResult | BrowserResult;

type BrowserResult = {
  type: 'cancel' | 'dismiss';
};

type RedirectResult = {
  type: 'success';
  url: string;
};

async function openBrowserAsync(url: string): Promise<BrowserResult> {
  return ExponentWebBrowser.openBrowserAsync(url);
}

function dismissBrowser(): void {
  ExponentWebBrowser.dismissBrowser();
}

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

function _authSessionIsNativelySupported(): boolean {
  if (Platform.OS === 'android') {
    return false;
  }

  const versionNumber = parseInt(String(Platform.Version), 10);
  return versionNumber >= 11;
}

let _redirectHandler: ((event: RedirectEvent) => void) | null = null;

async function _openAuthSessionPolyfillAsync(
  startUrl: string,
  returnUrl: string
): Promise<AuthSessionResult> {
  if (_redirectHandler) {
    throw new Error(
      `The WebBrowser's auth session is in an invalid state with a redirect handler set when it should not be`
    );
  }

  try {
    return await Promise.race([openBrowserAsync(startUrl), _waitForRedirectAsync(returnUrl)]);
  } finally {
    dismissBrowser();
    if (!_redirectHandler) {
      throw new Error(
        `The WebBrowser auth session is in an invalid state with no redirect handler when one should be set`
      );
    }
    Linking.removeEventListener('url', _redirectHandler);
    _redirectHandler = null;
  }
}

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
