import { Linking, Platform, Alert } from 'react-native';
import { UnavailabilityError, CodedError } from 'expo-errors';
import ExponentWebBrowser from './ExpoWebBrowser';

type RedirectEvent = {
  url: string;
};

type OpenBrowserParams = {
  toolbarColor?: string;
  package?: string;
  enableBarCollapsing?: boolean;
  showTitle?: boolean;
};

type AuthSessionResult = RedirectResult | BrowserResult;

type CustomTabsBrowsersResults = {
  default: string;
  preferred: string;
  views: string[];
  services: string[];
};

type BrowserResult = {
  type: 'cancel' | 'dismiss';
};

type RedirectResult = {
  type: 'success';
  url: string;
};

export async function getCustomTabsSupportingBrowsersAsync(): Promise<CustomTabsBrowsersResults> {
  if (!ExponentWebBrowser.getCustomTabsSupportingBrowsersAsync) {
    throw new UnavailabilityError('WebBrowser', 'getCustomTabsSupportingBrowsersAsync');
  }
  return ExponentWebBrowser.getCustomTabsSupportingBrowsersAsync();
}

export async function warmUp(packageName?: string) {
  if (!ExponentWebBrowser.warmUp) {
    throw new UnavailabilityError('WebBrowser', 'warmUp');
  }
  let packageToWarm = packageName;
  if (!packageName) {
    packageToWarm = (await getCustomTabsSupportingBrowsersAsync()).preferred;
  }

  if (!packageToWarm) {
    throw new CodedError(
      'INSUFFICIENT_ARGS',
      'WebBrowser.warmUp is unable to determine package name without supplying it!'
    );
  } else {
    return ExponentWebBrowser.warmUp(packageToWarm);
  }
}

export async function mayInitWithUrl(url: string, packageName?: string) {
  if (!ExponentWebBrowser.mayInitWithUrl) {
    throw new UnavailabilityError('WebBrowser', 'warmUp');
  }
  let packageToWarm = packageName;
  if (!packageName) {
    packageToWarm = (await getCustomTabsSupportingBrowsersAsync()).preferred;
  }

  if (!packageToWarm) {
    throw new CodedError(
      'INSUFFICIENT_ARGS',
      'WebBrowser.warmUp is unable to determine package name without supplying it!'
    );
  } else {
    return ExponentWebBrowser.mayInitWithUrl(url, packageToWarm);
  }
}

export async function coolDown(packageName?: string) {
  if (!ExponentWebBrowser.coolDown) {
    throw new UnavailabilityError('WebBrowser', 'coolDown');
  }
  let packageToCool = packageName;
  if (!packageName) {
    packageToCool = (await getCustomTabsSupportingBrowsersAsync()).preferred;
  }

  if (!packageToCool) {
    throw new CodedError(
      'INSUFFICIENT_ARGS',
      'WebBrowser.warmUp is unable to determine package name without supplying it!'
    );
  } else {
    return ExponentWebBrowser.coolDown(packageToCool);
  }
}

export async function openBrowserAsync(
  url: string,
  browserParams: OpenBrowserParams = {}
): Promise<BrowserResult> {
  if (!ExponentWebBrowser.openBrowserAsync) {
    throw new UnavailabilityError('WebBrowser', 'openBrowserAsync');
  }
  return ExponentWebBrowser.openBrowserAsync(url, browserParams);
}

export function dismissBrowser(): void {
  if (!ExponentWebBrowser.dismissBrowser) {
    throw new UnavailabilityError('WebBrowser', 'dismissBrowser');
  }
  ExponentWebBrowser.dismissBrowser();
}

export async function openAuthSessionAsync(
  url: string,
  redirectUrl: string
): Promise<AuthSessionResult> {
  if (_authSessionIsNativelySupported()) {
    if (!ExponentWebBrowser.openAuthSessionAsync) {
      throw new UnavailabilityError('WebBrowser', 'openAuthSessionAsync');
    }
    return ExponentWebBrowser.openAuthSessionAsync(url, redirectUrl);
  } else {
    return _openAuthSessionPolyfillAsync(url, redirectUrl);
  }
}

export function dismissAuthSession(): void {
  if (_authSessionIsNativelySupported()) {
    if (!ExponentWebBrowser.dismissAuthSession) {
      throw new UnavailabilityError('WebBrowser', 'dismissAuthSession');
    }
    ExponentWebBrowser.dismissAuthSession();
  } else {
    if (!ExponentWebBrowser.dismissBrowser) {
      throw new UnavailabilityError('WebBrowser', 'dismissAuthSession');
    }
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
