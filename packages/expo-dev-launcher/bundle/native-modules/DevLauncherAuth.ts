import { requireNativeModule } from 'expo-modules-core';
import {
  AppState,
  EmitterSubscription,
  Linking,
  Platform,
  NativeEventSubscription,
  NativeModules,
} from 'react-native';

const DevLauncherAuth =
  Platform.OS === 'ios'
    ? requireNativeModule('ExpoDevLauncherAuth')
    : NativeModules.EXDevLauncherAuth;

let appStateSubscription: NativeEventSubscription | null = null;
let redirectSubscription: EmitterSubscription | null = null;
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
  if (!redirectSubscription) {
    throw new Error(
      `The WebBrowser auth session is in an invalid state with no redirect handler when one should be set`
    );
  }

  redirectSubscription.remove();
  redirectSubscription = null;
}

async function openBrowserAndWaitAndroidAsync(startUrl: string): Promise<any> {
  const appStateChangedToActive = new Promise<void>((resolve) => {
    onWebBrowserCloseAndroid = resolve;
    appStateSubscription = AppState.addEventListener('change', onAppStateChangeAndroid);
  });

  let result = { type: 'cancel' };
  await DevLauncherAuth.openWebBrowserAsync(startUrl);
  const type = 'opened';

  if (type === 'opened') {
    await appStateChangedToActive;
    result = { type: 'dismiss' };
  }

  if (appStateSubscription != null) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  onWebBrowserCloseAndroid = null;
  return result;
}

function waitForRedirectAsync(returnUrl: string): Promise<any> {
  return new Promise((resolve) => {
    const redirectHandler = (event: any) => {
      if (event.url.startsWith(returnUrl)) {
        resolve({ url: event.url, type: 'success' });
      }
    };

    redirectSubscription = Linking.addEventListener('url', redirectHandler);
  });
}

async function openAuthSessionPolyfillAsync(startUrl: string, returnUrl: string): Promise<any> {
  if (redirectSubscription) {
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
  if (DevLauncherAuth.openAuthSessionAsync) {
    // iOS
    return await DevLauncherAuth.openAuthSessionAsync(url, returnUrl);
  }
  // Android
  return await openAuthSessionPolyfillAsync(url, returnUrl);
}

export async function getAuthSchemeAsync(): Promise<string> {
  if (Platform.OS === 'android') {
    return 'expo-dev-launcher';
  }

  return await DevLauncherAuth.getAuthSchemeAsync();
}

export async function setSessionAsync(session: string): Promise<void> {
  return await DevLauncherAuth.setSessionAsync(session);
}

export async function restoreSessionAsync(): Promise<{
  [key: string]: any;
  sessionSecret: string;
}> {
  return await DevLauncherAuth.restoreSessionAsync();
}
