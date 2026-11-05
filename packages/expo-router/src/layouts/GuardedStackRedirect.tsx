'use client';

import { useIsPreview } from '../link/preview/PreviewRouteContext';
import {
  StackActions,
  type NavigationAction,
  type NavigationState,
} from '../react-navigation/native';
import { useFocusEffect } from '../useFocusEffect';

export function GuardedStackRedirect({
  navigation,
  fallbackRoute,
}: {
  navigation: {
    dispatch(action: NavigationAction): void;
    getState(): NavigationState | undefined;
  };
  fallbackRoute: { name: string; params?: object };
}) {
  const isPreview = useIsPreview();

  useFocusEffect(() => {
    if (!isPreview) {
      navigation.dispatch({
        ...StackActions.replace(fallbackRoute.name, fallbackRoute.params),
        target: navigation.getState()?.key,
      });
    }
  });

  return null;
}
