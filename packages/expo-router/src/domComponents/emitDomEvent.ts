import type { LinkToOptions, TransitionOptions } from '../global-state/types';
import {
  ROUTER_SET_PARAMS_TYPE,
  ROUTER_DISMISS_TYPE,
  ROUTER_BACK_TYPE,
  ROUTER_DISMISS_ALL_TYPE,
  ROUTER_LINK_TYPE,
} from './events';

function emitDomEvent(type: string, data: any = {}) {
  // @ts-expect-error: ReactNativeWebView is a global variable injected by the WebView
  if (typeof $$EXPO_INITIAL_PROPS !== 'undefined' && typeof ReactNativeWebView !== 'undefined') {
    (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
    return true;
  }
  return false;
}

export function emitDomSetParams(
  params: Record<string, undefined | string | number | (string | number)[]> = {}
) {
  return emitDomEvent(ROUTER_SET_PARAMS_TYPE, { params });
}

export function emitDomDismiss(count?: number, options?: TransitionOptions) {
  return emitDomEvent(ROUTER_DISMISS_TYPE, { count, options });
}

export function emitDomGoBack(options?: TransitionOptions) {
  return emitDomEvent(ROUTER_BACK_TYPE, { options });
}

export function emitDomDismissAll(options?: TransitionOptions) {
  return emitDomEvent(ROUTER_DISMISS_ALL_TYPE, { options });
}

export function emitDomLinkEvent(href: string, options: LinkToOptions) {
  return emitDomEvent(ROUTER_LINK_TYPE, { href, options });
}
