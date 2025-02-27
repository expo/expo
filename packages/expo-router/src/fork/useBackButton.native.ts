/**
 * This file is unchanged, except for removing eslint comments
 */
import type { NavigationContainerRef, ParamListBase } from '@react-navigation/native';
import { BackHandler } from 'expo-router/react-native';
import * as React from 'react';

export function useBackButton(ref: React.RefObject<NavigationContainerRef<ParamListBase>>) {
  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const navigation = ref.current;

      if (navigation == null) {
        return false;
      }

      if (navigation.canGoBack()) {
        navigation.goBack();

        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [ref]);
}
