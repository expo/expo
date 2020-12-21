import { CodedError, Platform } from '@unimodules/core';
import compareUrls from 'compare-urls';
import { AppState, Dimensions, AppStateStatus } from 'react-native';

import {
  WebBrowserAuthSessionResult,
  WebBrowserOpenOptions,
  WebBrowserResult,
  WebBrowserResultType,
  WebBrowserWindowFeatures,
} from './WebBrowser.types';

const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 650;

let popupWindow: Window | null = null;

const listenerMap = new Map();

const getHandle = () => 'ExpoWebBrowserRedirectHandle';
const getOriginUrlHandle = (hash: string) => `ExpoWebBrowser_OriginUrl_${hash}`;
const getRedirectUrlHandle = (hash: string) => `ExpoWebBrowser_RedirectUrl_${hash}`;

function dismissPopup() {
  if (!popupWindow) {
    return;
  }
  popupWindow.close();
  if (listenerMap.has(popupWindow)) {
    const { listener, appStateListener, interval } = listenerMap.get(popupWindow);
    clearInterval(interval);
    window.removeEventListener('message', listener);
    AppState.removeEventListener('change', appStateListener);
    listenerMap.delete(popupWindow);

    const handle = window.localStorage.getItem(getHandle());
    if (handle) {
      window.localStorage.removeItem(getHandle());
      window.localStorage.removeItem(getOriginUrlHandle(handle));
      window.localStorage.removeItem(getRedirectUrlHandle(handle));
    }

    popupWindow = null;
  }
}

export default {
  get name() {
    return 'ExpoWebBrowser';
  },
  async openBrowserAsync(
    url: string,
    browserParams: WebBrowserOpenOptions = {}
  ): Promise<WebBrowserResult> {
    if (!Platform.isDOMAvailable) return { type: WebBrowserResultType.CANCEL };
    const { windowName = '_blank', windowFeatures } = browserParams;
    const features = getPopupFeaturesString(windowFeatures);
    window.open(url, windowName, features);
    return { type: WebBrowserResultType.OPENED };
  },
  dismissAuthSession() {
    if (!Platform.isDOMAvailable) return;
    dismissPopup();
  },
  maybeCompleteAuthSession({
    skipRedirectCheck,
  }: {
    skipRedirectCheck?: boolean;
  }): { type: 'success' | 'failed'; message: string } {
    if (!Platform.isDOMAvailable) {
      return {
        type: 'failed',
        message: 'Cannot use expo-web-browser in a non-browser environment',
      };
    }
    const handle = window.localStorage.getItem(getHandle());

    if (!handle) {
      return { type: 'failed', message: 'No auth session is currently in progress' };
    }

    const url = window.location.href;

    if (skipRedirectCheck !== true) {
      const redirectUrl = window.localStorage.getItem(getRedirectUrlHandle(handle));
      // Compare the original redirect url against the current url with it's query params removed.
      const currentUrl = window.location.origin + window.location.pathname;
      if (!compareUrls(redirectUrl, currentUrl)) {
        return {
          type: 'failed',
          message: `Current URL "${currentUrl}" and original redirect URL "${redirectUrl}" do not match.`,
        };
      }
    }

    // Save the link for app state listener
    window.localStorage.setItem(getOriginUrlHandle(handle), url);

    // Get the window that created the current popup
    const parent = window.opener ?? window.parent;
    if (!parent) {
      throw new CodedError(
        'ERR_WEB_BROWSER_REDIRECT',
        `The window cannot complete the redirect request because the invoking window doesn't have a reference to it's parent. This can happen if the parent window was reloaded.`
      );
    }
    // Send the URL back to the opening window.
    parent.postMessage({ url, expoSender: handle }, parent.location);
    return { type: 'success', message: `Attempting to complete auth` };

    // Maybe set timer to throw an error if the window is still open after attempting to complete.
  },
  // This method should be invoked from user input.
  async openAuthSessionAsync(
    url: string,
    redirectUrl?: string,
    openOptions?: WebBrowserOpenOptions
  ): Promise<WebBrowserAuthSessionResult> {
    if (!Platform.isDOMAvailable) return { type: WebBrowserResultType.CANCEL };

    redirectUrl = redirectUrl ?? getRedirectUrlFromUrlOrGenerate(url);

    const state = await getStateFromUrlOrGenerateAsync(url);

    // Save handle for session
    window.localStorage.setItem(getHandle(), state);
    // Save redirect Url for further verification
    window.localStorage.setItem(getRedirectUrlHandle(state), redirectUrl);

    if (popupWindow == null || popupWindow?.closed) {
      const features = getPopupFeaturesString(openOptions?.windowFeatures);
      popupWindow = window.open(url, openOptions?.windowName, features);

      if (popupWindow) {
        try {
          popupWindow.focus();
        } catch (e) {}
      } else {
        throw new CodedError(
          'ERR_WEB_BROWSER_BLOCKED',
          'Popup window was blocked by the browser or failed to open. This can happen in mobile browsers when the window.open() method was invoked too long after a user input was fired.'
        );
      }
    }

    return new Promise(async resolve => {
      // Create a listener for messages sent from the popup
      const listener = (event: MessageEvent) => {
        if (!event.isTrusted) return;
        // Ensure we trust the sender.
        if (event.origin !== window.location.origin) {
          return;
        }
        const { data } = event;
        // Use a crypto hash to invalid message.
        const handle = window.localStorage.getItem(getHandle());
        // Ensure the sender is also from expo-web-browser
        if (data.expoSender === handle) {
          dismissPopup();
          resolve({ type: 'success', url: data.url });
        }
      };

      // Add a listener for receiving messages from the popup.
      window.addEventListener('message', listener, false);

      // Create an app state listener as a fallback to the popup listener
      const appStateListener = (state: AppStateStatus) => {
        if (state !== 'active') {
          return;
        }
        const handle = window.localStorage.getItem(getHandle());
        if (handle) {
          const url = window.localStorage.getItem(getOriginUrlHandle(handle));
          if (url) {
            dismissPopup();
            resolve({ type: 'success', url });
          }
        }
      };

      AppState.addEventListener('change', appStateListener);

      // Check if the window has been closed every second.
      const interval = setInterval(() => {
        if (popupWindow?.closed) {
          if (resolve) resolve({ type: WebBrowserResultType.DISMISS });
          clearInterval(interval);
          dismissPopup();
        }
      }, 1000);

      // Store the listener and interval for clean up.
      listenerMap.set(popupWindow, {
        listener,
        interval,
        appStateListener,
      });
    });
  },
};

// Crypto
function isCryptoAvailable(): boolean {
  if (!Platform.isDOMAvailable) return false;
  return !!(window?.crypto as any);
}

function isSubtleCryptoAvailable(): boolean {
  if (!isCryptoAvailable()) return false;
  return !!(window.crypto.subtle as any);
}

async function getStateFromUrlOrGenerateAsync(inputUrl: string): Promise<string> {
  const url = new URL(inputUrl);
  if (url.searchParams.has('state') && typeof url.searchParams.get('state') === 'string') {
    // Ensure we reuse the auth state if it's passed in.
    return url.searchParams.get('state')!;
  }
  // Generate a crypto state for verifying the return popup.
  return await generateStateAsync();
}

function getRedirectUrlFromUrlOrGenerate(inputUrl: string): string {
  const url = new URL(inputUrl);
  if (
    url.searchParams.has('redirect_uri') &&
    typeof url.searchParams.get('redirect_uri') === 'string'
  ) {
    // Ensure we reuse the redirect_uri if it's passed in the input url.
    return url.searchParams.get('redirect_uri')!;
  }
  // Emulate how native uses Constants.linkingUrl
  return location.origin + location.pathname;
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

async function generateStateAsync(): Promise<string> {
  if (!isSubtleCryptoAvailable()) {
    throw new CodedError(
      'ERR_WEB_BROWSER_CRYPTO',
      `The current environment doesn't support crypto. Ensure you are running from a secure origin (https).`
    );
  }
  const encoder = new TextEncoder();

  const data = generateRandom(10);
  const buffer = encoder.encode(data);
  const hashedData = await crypto.subtle.digest('SHA-256', buffer);
  const state = btoa(String.fromCharCode(...new Uint8Array(hashedData)));
  return state;
}

function generateRandom(size: number): string {
  let arr = new Uint8Array(size);
  if (arr.byteLength !== arr.length) {
    arr = new Uint8Array(arr.buffer);
  }
  const array = new Uint8Array(arr.length);
  if (isCryptoAvailable()) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < size; i += 1) {
      array[i] = (Math.random() * CHARSET.length) | 0;
    }
  }
  return bufferToString(array);
}

function bufferToString(buffer): string {
  const state: string[] = [];
  for (let i = 0; i < buffer.byteLength; i += 1) {
    const index = buffer[i] % CHARSET.length;
    state.push(CHARSET[index]);
  }
  return state.join('');
}

// Window Features

// Ensure feature string is an object
function normalizePopupFeaturesString(
  options?: WebBrowserWindowFeatures | string
): Record<string, any> {
  let windowFeatures: Record<string, any> = {};
  // This should be avoided because it adds extra time to the popup command.
  if (typeof options === 'string') {
    // Convert string of `key=value,foo=bar` into an object
    const windowFeaturePairs = options.split(',');
    for (const pair of windowFeaturePairs) {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        windowFeaturePairs[key] = value;
      }
    }
  } else if (options) {
    windowFeatures = options;
  }
  return windowFeatures;
}

// Apply default values to the input feature set
function getPopupFeaturesString(options?: WebBrowserWindowFeatures | string): string {
  const windowFeatures = normalizePopupFeaturesString(options);

  const width = windowFeatures.width ?? POPUP_WIDTH;
  const height = windowFeatures.height ?? POPUP_HEIGHT;

  const dimensions = Dimensions.get('screen');
  const top = windowFeatures.top ?? Math.max(0, (dimensions.height - height) * 0.5);
  const left = windowFeatures.left ?? Math.max(0, (dimensions.width - width) * 0.5);

  // Create a reasonable popup
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/open#Window_features
  return featureObjectToString({
    ...windowFeatures,
    // Toolbar buttons (Back, Forward, Reload, Stop buttons).
    toolbar: windowFeatures.toolbar ?? 'no',
    menubar: windowFeatures.menubar ?? 'no',
    // Shows the location bar or the address bar.
    location: windowFeatures.location ?? 'yes',
    resizable: windowFeatures.resizable ?? 'yes',
    // If this feature is on, then the new secondary window has a status bar.
    status: windowFeatures.status ?? 'no',
    scrollbars: windowFeatures.scrollbars ?? 'yes',
    top,
    left,
    width,
    height,
  });
}

export function featureObjectToString(features: Record<string, any>): string {
  return Object.keys(features).reduce<string>((prev, current) => {
    let value = features[current];
    if (typeof value === 'boolean') {
      value = value ? 'yes' : 'no';
    }
    if (current && value) {
      if (prev) prev += ',';
      return `${prev}${current}=${value}`;
    }
    return prev;
  }, '');
}
