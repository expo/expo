/**
 * This file is unchanged, except for removing eslint comments
 */
import * as React from 'react';
import { BackHandler } from 'react-native';

import {
  CommonActions,
  type NavigationContainerRef,
  type ParamListBase,
} from '../react-navigation/native';

export function useBackButton(ref: React.RefObject<NavigationContainerRef<ParamListBase>>) {
  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const navigation = ref.current;

      if (navigation == null) {
        return false;
      }

      if (navigation.canGoBack()) {
        // Hardware back is native-induced: the OS already committed the back gesture, so the JS
        // echo must land synchronously (D5), not be deferred behind a transition.
        navigation.dispatch(CommonActions.goBack(), { urgent: true });

        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [ref]);
}
