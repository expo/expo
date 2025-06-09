import {
  ROUTER_SET_PARAMS_TYPE,
  ROUTER_DISMISS_TYPE,
  ROUTER_BACK_TYPE,
  ROUTER_DISMISS_ALL_TYPE,
  ROUTER_LINK_TYPE,
} from './events';
import { LinkToOptions } from '../global-state/routing';

function emitDomEvent(type: string, data: any = {}) {
  // @ts-expect-error: ReactNativeWebView is a global variable injected by the WebView
  if (typeof ReactNativeWebView !== 'undefined') {
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

export function emitDomDismiss(count?: number) {
  return emitDomEvent(ROUTER_DISMISS_TYPE, { count });
}

export function emitDomGoBack() {
  return emitDomEvent(ROUTER_BACK_TYPE);
}

export function emitDomDismissAll() {
  return emitDomEvent(ROUTER_DISMISS_ALL_TYPE);
}

export function emitDomLinkEvent(href: string, options: LinkToOptions) {
  return emitDomEvent(ROUTER_LINK_TYPE, { href, options });
}
