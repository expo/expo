import type {
  NavigationContainerRef,
  ParamListBase,
} from '@react-navigation/core';
import * as React from 'react';
import { BackHandler } from 'react-native';

export function useBackButton(
  ref: React.RefObject<NavigationContainerRef<ParamListBase> | null>
) {
  React.useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        const navigation = ref.current;

        if (navigation == null) {
          return false;
        }

        if (navigation.canGoBack()) {
          navigation.goBack();

          return true;
        }

        return false;
      }
    );

    return () => subscription.remove();
  }, [ref]);
}
