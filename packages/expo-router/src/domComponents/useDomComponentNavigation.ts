import { addGlobalDomEventListener } from 'expo/dom/global';
import React from 'react';

import {
  ROUTER_LINK_TYPE,
  ROUTER_DISMISS_ALL_TYPE,
  ROUTER_DISMISS_TYPE,
  ROUTER_BACK_TYPE,
  ROUTER_SET_PARAMS_TYPE,
} from './events';
import { dismiss, dismissAll, goBack, linkTo, setParams } from '../global-state/routing';

export function useDomComponentNavigation() {
  React.useEffect(() => {
    if (process.env.EXPO_OS === 'web') {
      return () => {};
    }
    return addGlobalDomEventListener<any>(({ type, data }) => {
      switch (type) {
        case ROUTER_LINK_TYPE:
          linkTo(data.href, data.options);
          break;
        case ROUTER_DISMISS_ALL_TYPE:
          dismissAll();
          break;
        case ROUTER_DISMISS_TYPE:
          dismiss(data.count);
          break;
        case ROUTER_BACK_TYPE:
          goBack();
          break;
        case ROUTER_SET_PARAMS_TYPE:
          setParams(data.params);
          break;
      }
    });
  }, []);
}
