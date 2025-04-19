import { addGlobalDomEventListener } from 'expo/dom/global';
import { useEffect } from 'react';

import { router } from '../imperative-api';
import {
  ROUTER_LINK_TYPE,
  ROUTER_DISMISS_ALL_TYPE,
  ROUTER_DISMISS_TYPE,
  ROUTER_BACK_TYPE,
  ROUTER_SET_PARAMS_TYPE,
} from './domEvents';

export function useDomComponentNavigation() {
  useEffect(() => {
    if (process.env.EXPO_OS === 'web') {
      return () => {};
    }
    return addGlobalDomEventListener<any>(({ type, data }) => {
      switch (type) {
        case ROUTER_LINK_TYPE:
          router.linkTo(data.href, data.options);
          break;
        case ROUTER_DISMISS_ALL_TYPE:
          router.dismissAll();
          break;
        case ROUTER_DISMISS_TYPE:
          router.dismiss(data.count);
          break;
        case ROUTER_BACK_TYPE:
          router.back();
          break;
        case ROUTER_SET_PARAMS_TYPE:
          router.setParams(data.params);
          break;
      }
    });
  }, []);
}
