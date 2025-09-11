import {
  ROUTER_SET_PARAMS_TYPE,
  ROUTER_DISMISS_TYPE,
  ROUTER_BACK_TYPE,
  ROUTER_DISMISS_ALL_TYPE,
  ROUTER_LINK_TYPE,
} from './events';
import { LinkToOptions } from '../global-state/routing';

const IS_DOM = typeof window !== 'undefined' && window.isDOMComponentContext === true;

function emitDomEvent(type: string, data: any = {}) {
  if (IS_DOM) {
    // @ts-expect-error: Added via react-native-webview
    window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
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
