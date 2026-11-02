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
        navigation.dispatchSync(CommonActions.goBack());

        return true;
      }

      return false;
    }) as ReturnType<typeof BackHandler.addEventListener> & {
      setNativeNavigationFallback?: (enabled: boolean) => void;
    };
    const updateOwnership = () =>
      subscription.setNativeNavigationFallback?.(
        ref.current?.isNativeBackNavigationOwned() === true
      );
    updateOwnership();
    const removeStateListener = ref.current?.addListener('state', updateOwnership);
    const removeOwnershipListener = ref.current?.addListener(
      'nativeBackOwnershipChange',
      updateOwnership
    );

    return () => {
      removeStateListener?.();
      removeOwnershipListener?.();
      subscription.remove();
    };
  }, [ref]);
}
