/**
 * This is the android auth polyfill from `expo-web-browser` for modified for Meta Quest. It opens the auth request
 * in the default system browser instead of a custom tab, due to redirect issues encountered on Meta Quest.
 * This is a workaround until the underlying issue is resolved. It's not optimal as the web browser is not
 * auto-closed after the redirect.
 *
 * TODO: @behenate - Use regular `expo-web-browser` Android implementation once the redirect issue is resolved.
 */

import {
  WebBrowserAuthSessionResult,
  WebBrowserRedirectResult,
  WebBrowserResult,
  WebBrowserResultType,
} from 'expo-web-browser';
import { RedirectEvent } from 'expo-web-browser/build/WebBrowser.types';
import { AppState, AppStateStatus, Linking, EmitterSubscription } from 'react-native';

export async function openQuestAuthSessionAsync(
  url: string,
  redirectUrl?: string | null
): Promise<WebBrowserAuthSessionResult> {
  if (_redirectSubscription) {
    throw new Error(
      `The WebBrowser's auth session is in an invalid state with a redirect handler set when it should not be`
    );
  }

  if (_onWebBrowserCloseQuest) {
    throw new Error(`WebBrowser is already open, only one can be open at a time`);
  }

  try {
    return await Promise.race([
      _openBrowserAndWaitQuestAsync(url),
      _waitForRedirectAsync(redirectUrl),
    ]);
  } finally {
    _stopWaitingForRedirect();
  }
}
let _redirectSubscription: EmitterSubscription | null = null;
let _onWebBrowserCloseQuest: null | (() => void) = null;
let _isAppStateAvailable: boolean = AppState.currentState !== null;

function _onAppStateChangeQuest(state: AppStateStatus) {
  if (!_isAppStateAvailable) {
    _isAppStateAvailable = true;
    return;
  }

  if (state === 'active' && _onWebBrowserCloseQuest) {
    _onWebBrowserCloseQuest();
  }
}

async function _openBrowserAndWaitQuestAsync(startUrl: string): Promise<WebBrowserResult> {
  const appStateChangedToActive = new Promise<void>((resolve) => {
    _onWebBrowserCloseQuest = resolve;
  });
  const stateChangeSubscription = AppState.addEventListener('change', _onAppStateChangeQuest);

  let result: WebBrowserResult = { type: WebBrowserResultType.CANCEL };

  try {
    await Linking.openURL(startUrl);
    await appStateChangedToActive;
    result = { type: WebBrowserResultType.DISMISS }; // User returned to the app
  } catch (e) {
    stateChangeSubscription.remove();
    _onWebBrowserCloseQuest = null;
    throw e;
  }

  stateChangeSubscription.remove();
  _onWebBrowserCloseQuest = null;
  return result;
}

function _stopWaitingForRedirect() {
  if (!_redirectSubscription) {
    throw new Error(
      `The WebBrowser auth session is in an invalid state with no redirect handler when one should be set`
    );
  }

  _redirectSubscription.remove();
  _redirectSubscription = null;
}

function _waitForRedirectAsync(returnUrl?: string | null): Promise<WebBrowserRedirectResult> {
  return new Promise((resolve) => {
    const redirectHandler = (event: RedirectEvent) => {
      if (returnUrl && event.url.startsWith(returnUrl)) {
        resolve({ url: event.url, type: 'success' });
      }
    };

    _redirectSubscription = Linking.addEventListener('url', redirectHandler);
  });
}
