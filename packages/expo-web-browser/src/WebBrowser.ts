import { UnavailabilityError } from '@unimodules/core';
import { AppState, AppStateStatus, Linking, Platform } from 'react-native';

import ExponentWebBrowser from './ExpoWebBrowser';
import {
  RedirectEvent,
  WebBrowserAuthSessionResult,
  WebBrowserCoolDownResult,
  WebBrowserCustomTabsResults,
  WebBrowserMayInitWithUrlResult,
  WebBrowserOpenOptions,
  WebBrowserRedirectResult,
  WebBrowserResult,
  WebBrowserResultType,
  WebBrowserWarmUpResult,
  WebBrowserWindowFeatures,
} from './WebBrowser.types';

export {
  WebBrowserAuthSessionResult,
  WebBrowserCoolDownResult,
  WebBrowserCustomTabsResults,
  WebBrowserMayInitWithUrlResult,
  WebBrowserOpenOptions,
  WebBrowserRedirectResult,
  WebBrowserResult,
  WebBrowserResultType,
  WebBrowserWarmUpResult,
  WebBrowserWindowFeatures,
};

const emptyCustomTabsPackages: WebBrowserCustomTabsResults = {
  defaultBrowserPackage: undefined,
  preferredBrowserPackage: undefined,
  browserPackages: [],
  servicePackages: [],
};

export async function getCustomTabsSupportingBrowsersAsync(): Promise<WebBrowserCustomTabsResults> {
  if (!ExponentWebBrowser.getCustomTabsSupportingBrowsersAsync) {
    throw new UnavailabilityError('WebBrowser', 'getCustomTabsSupportingBrowsersAsync');
  }
  if (Platform.OS !== 'android') {
    return emptyCustomTabsPackages;
  } else {
    return await ExponentWebBrowser.getCustomTabsSupportingBrowsersAsync();
  }
}

export async function warmUpAsync(browserPackage?: string): Promise<WebBrowserWarmUpResult> {
  if (!ExponentWebBrowser.warmUpAsync) {
    throw new UnavailabilityError('WebBrowser', 'warmUpAsync');
  }
  if (Platform.OS !== 'android') {
    return {};
  } else {
    return await ExponentWebBrowser.warmUpAsync(browserPackage);
  }
}

export async function mayInitWithUrlAsync(
  url: string,
  browserPackage?: string
): Promise<WebBrowserMayInitWithUrlResult> {
  if (!ExponentWebBrowser.mayInitWithUrlAsync) {
    throw new UnavailabilityError('WebBrowser', 'mayInitWithUrlAsync');
  }
  if (Platform.OS !== 'android') {
    return {};
  } else {
    return await ExponentWebBrowser.mayInitWithUrlAsync(url, browserPackage);
  }
}

export async function coolDownAsync(browserPackage?: string): Promise<WebBrowserCoolDownResult> {
  if (!ExponentWebBrowser.coolDownAsync) {
    throw new UnavailabilityError('WebBrowser', 'coolDownAsync');
  }
  if (Platform.OS !== 'android') {
    return {};
  } else {
    return await ExponentWebBrowser.coolDownAsync(browserPackage);
  }
}

let browserLocked = false;

export async function openBrowserAsync(
  url: string,
  browserParams: WebBrowserOpenOptions = {}
): Promise<WebBrowserResult> {
  if (!ExponentWebBrowser.openBrowserAsync) {
    throw new UnavailabilityError('WebBrowser', 'openBrowserAsync');
  }

  if (browserLocked) {
    // Prevent multiple sessions from running at the same time, WebBrowser doesn't
    // support it this makes the behavior predictable.
    if (__DEV__) {
      console.warn(
        'Attempted to call WebBrowser.openBrowserAsync multiple times while already active. Only one WebBrowser controller can be active at any given time.'
      );
    }

    return { type: 'locked' };
  }
  browserLocked = true;

  let result: WebBrowserResult;
  try {
    result = await ExponentWebBrowser.openBrowserAsync(url, browserParams);
  } finally {
    // WebBrowser session complete, unset lock
    browserLocked = false;
  }

  return result;
}

export function dismissBrowser(): void {
  if (!ExponentWebBrowser.dismissBrowser) {
    throw new UnavailabilityError('WebBrowser', 'dismissBrowser');
  }
  ExponentWebBrowser.dismissBrowser();
}

export async function openAuthSessionAsync(
  url: string,
  redirectUrl: string,
  browserParams: WebBrowserOpenOptions = {}
): Promise<WebBrowserAuthSessionResult> {
  if (_authSessionIsNativelySupported()) {
    if (!ExponentWebBrowser.openAuthSessionAsync) {
      throw new UnavailabilityError('WebBrowser', 'openAuthSessionAsync');
    }
    if (Platform.OS === 'web') {
      return ExponentWebBrowser.openAuthSessionAsync(url, redirectUrl, browserParams);
    }
    return ExponentWebBrowser.openAuthSessionAsync(url, redirectUrl);
  } else {
    return _openAuthSessionPolyfillAsync(url, redirectUrl, browserParams);
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

/**
 * Attempts to complete an auth session in the browser.
 *
 * @param options
 */
export function maybeCompleteAuthSession(
  options: { skipRedirectCheck?: boolean } = {}
): { type: 'success' | 'failed'; message: string } {
  if (ExponentWebBrowser.maybeCompleteAuthSession) {
    return ExponentWebBrowser.maybeCompleteAuthSession(options);
  }
  return { type: 'failed', message: 'Not supported on this platform' };
}

/* iOS <= 10 and Android polyfill for SFAuthenticationSession flow */

function _authSessionIsNativelySupported(): boolean {
  if (Platform.OS === 'android') {
    return false;
  } else if (Platform.OS === 'web') {
    return true;
  }

  const versionNumber = parseInt(String(Platform.Version), 10);
  return versionNumber >= 11;
}

let _redirectHandler: ((event: RedirectEvent) => void) | null = null;

/*
 * openBrowserAsync on Android doesn't wait until closed, so we need to polyfill
 * it with AppState
 */

// Store the `resolve` function from a Promise to fire when the AppState
// returns to active
let _onWebBrowserCloseAndroid: null | (() => void) = null;

// If the initial AppState.currentState is null, we assume that the first call to
// AppState#change event is not actually triggered by a real change,
// is triggered instead by the bridge capturing the current state
// (https://reactnative.dev/docs/appstate#basic-usage)
let _isAppStateAvailable: boolean = AppState.currentState !== null;
function _onAppStateChangeAndroid(state: AppStateStatus) {
  if (!_isAppStateAvailable) {
    _isAppStateAvailable = true;
    return;
  }

  if (state === 'active' && _onWebBrowserCloseAndroid) {
    _onWebBrowserCloseAndroid();
  }
}

async function _openBrowserAndWaitAndroidAsync(
  startUrl: string,
  browserParams: WebBrowserOpenOptions = {}
): Promise<WebBrowserResult> {
  const appStateChangedToActive = new Promise(resolve => {
    _onWebBrowserCloseAndroid = resolve;
    AppState.addEventListener('change', _onAppStateChangeAndroid);
  });

  let result: WebBrowserResult = { type: 'cancel' };
  const { type } = await openBrowserAsync(startUrl, browserParams);

  if (type === 'opened') {
    await appStateChangedToActive;
    result = { type: 'dismiss' };
  }

  AppState.removeEventListener('change', _onAppStateChangeAndroid);
  _onWebBrowserCloseAndroid = null;
  return result;
}

async function _openAuthSessionPolyfillAsync(
  startUrl: string,
  returnUrl: string,
  browserParams: WebBrowserOpenOptions = {}
): Promise<WebBrowserAuthSessionResult> {
  if (_redirectHandler) {
    throw new Error(
      `The WebBrowser's auth session is in an invalid state with a redirect handler set when it should not be`
    );
  }

  if (_onWebBrowserCloseAndroid) {
    throw new Error(`WebBrowser is already open, only one can be open at a time`);
  }

  try {
    if (Platform.OS === 'android') {
      return await Promise.race([
        _openBrowserAndWaitAndroidAsync(startUrl, browserParams),
        _waitForRedirectAsync(returnUrl),
      ]);
    } else {
      return await Promise.race([
        openBrowserAsync(startUrl, browserParams),
        _waitForRedirectAsync(returnUrl),
      ]);
    }
  } finally {
    // We can't dismiss the browser on Android, only call this when it's available.
    // Users on Android need to manually press the 'x' button in Chrome Custom Tabs, sadly.
    if (ExponentWebBrowser.dismissBrowser) {
      ExponentWebBrowser.dismissBrowser();
    }

    _stopWaitingForRedirect();
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

function _waitForRedirectAsync(returnUrl: string): Promise<WebBrowserRedirectResult> {
  return new Promise(resolve => {
    _redirectHandler = (event: RedirectEvent) => {
      if (event.url.startsWith(returnUrl)) {
        resolve({ url: event.url, type: 'success' });
      }
    };

    Linking.addEventListener('url', _redirectHandler);
  });
}
