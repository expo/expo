import { IS_DOM } from 'expo/dom';
import { addGlobalDomEventListener } from 'expo/dom/global';
import React from 'react';

import type { RouterStore } from '../global-state/router-store';
import type { LinkToOptions } from '../global-state/routing';

const ROUTER_LINK_TYPE = '$$router_link';
const ROUTER_DISMISS_ALL_TYPE = '$$router_dismissAll';
const ROUTER_DISMISS_TYPE = '$$router_dismiss';
const ROUTER_BACK_TYPE = '$$router_goBack';
const ROUTER_SET_PARAMS_TYPE = '$$router_setParams';

function emitDomEvent(type: string, data: any = {}) {
  if (IS_DOM) {
    (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
    return true;
  }
  return false;
}

export function emitDomSetParams(
  params: Record<string, string | number | (string | number)[]> = {}
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

export function useDomComponentNavigation(store: RouterStore) {
  React.useEffect(() => {
    if (!IS_DOM && process.env.EXPO_OS !== 'web') {
      return addGlobalDomEventListener<any>(({ type, data }) => {
        switch (type) {
          case ROUTER_LINK_TYPE:
            store.linkTo(data.href, data.options);
            break;
          case ROUTER_DISMISS_ALL_TYPE:
            store.dismissAll();
            break;
          case ROUTER_DISMISS_TYPE:
            store.dismiss(data.count);
            break;
          case ROUTER_BACK_TYPE:
            store.goBack();
            break;
          case ROUTER_SET_PARAMS_TYPE:
            store.setParams(data.params);
            break;
        }
      });
    }
    return () => {};
  }, [store]);
}
