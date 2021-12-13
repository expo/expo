import { NativeModules, AppState, Linking } from 'react-native';

const DevMenu = NativeModules.ExpoDevMenuInternal;

let redirectHandler: ((event: any) => void) | null = null;
let onWebBrowserCloseAndroid: null | (() => void) = null;
let isAppStateAvailable: boolean = AppState.currentState !== null;

function onAppStateChangeAndroid(state: any) {
  if (!isAppStateAvailable) {
    isAppStateAvailable = true;
    return;
  }

  if (state === 'active' && onWebBrowserCloseAndroid) {
    onWebBrowserCloseAndroid();
  }
}

function stopWaitingForRedirect() {
  if (!redirectHandler) {
    throw new Error(
      `The WebBrowser auth session is in an invalid state with no redirect handler when one should be set`
    );
  }

  Linking.removeEventListener('url', redirectHandler);
  redirectHandler = null;
}

async function openBrowserAndWaitAndroidAsync(startUrl: string): Promise<any> {
  const appStateChangedToActive = new Promise(resolve => {
    onWebBrowserCloseAndroid = resolve;
    AppState.addEventListener('change', onAppStateChangeAndroid);
  });

  let result = { type: 'cancel' };
  await DevMenu.openWebBrowserAsync(startUrl);
  const type = 'opened';

  if (type === 'opened') {
    await appStateChangedToActive;
    result = { type: 'dismiss' };
  }

  AppState.removeEventListener('change', onAppStateChangeAndroid);
  onWebBrowserCloseAndroid = null;
  return result;
}

function waitForRedirectAsync(returnUrl: string): Promise<any> {
  return new Promise(resolve => {
    redirectHandler = (event: any) => {
      if (event.url.startsWith(returnUrl)) {
        resolve({ url: event.url, type: 'success' });
      }
    };

    Linking.addEventListener('url', redirectHandler);
  });
}

async function openAuthSessionPolyfillAsync(startUrl: string, returnUrl: string): Promise<any> {
  if (redirectHandler) {
    throw new Error(
      `The WebBrowser's auth session is in an invalid state with a redirect handler set when it should not be`
    );
  }

  if (onWebBrowserCloseAndroid) {
    throw new Error(`WebBrowser is already open, only one can be open at a time`);
  }

  try {
    return await Promise.race([
      openBrowserAndWaitAndroidAsync(startUrl),
      waitForRedirectAsync(returnUrl),
    ]);
  } finally {
    stopWaitingForRedirect();
  }
}

export async function openAuthSessionAsync(url: string, returnUrl: string): Promise<any> {
  if (DevMenu.openAuthSessionAsync) {
    // iOS
    return await DevMenu.openAuthSessionAsync(url, returnUrl);
  }
  // Android
  return await openAuthSessionPolyfillAsync(url, returnUrl);
}
