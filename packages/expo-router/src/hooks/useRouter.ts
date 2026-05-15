'use client';

import type { ImperativeRouter } from '../imperative-api';
import { router } from '../imperative-api';
import { usePreviewInfo } from '../link/preview/PreviewRouteContext';

const displayWarningForProp = (prop: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `router.${prop} should not be used in a previewed screen. To fix this issue, wrap navigation calls with 'if (!isPreview) { ... }'.`
    );
  }
};

const createNOOPWithWarning = (prop: string) => () => displayWarningForProp(prop);

const routerWithWarnings: ImperativeRouter = {
  back: createNOOPWithWarning('back'),
  canGoBack: () => {
    displayWarningForProp('canGoBack');
    return false;
  },
  push: createNOOPWithWarning('push'),
  navigate: createNOOPWithWarning('navigate'),
  replace: createNOOPWithWarning('replace'),
  dismiss: createNOOPWithWarning('dismiss'),
  dismissTo: createNOOPWithWarning('dismissTo'),
  dismissAll: createNOOPWithWarning('dismissAll'),
  canDismiss: () => {
    displayWarningForProp('canDismiss');
    return false;
  },
  setParams: createNOOPWithWarning('setParams'),
  reload: createNOOPWithWarning('reload'),
  prefetch: createNOOPWithWarning('prefetch'),
};

/**
 *
 * Returns the [Router](#router) object for imperative navigation.
 *
 * @example
 *```tsx
 * import { useRouter } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * export default function Route() {
 *  const router = useRouter();
 *
 *  return (
 *   <Text onPress={() => router.push('/home')}>Go Home</Text>
 *  );
 *}
 * ```
 */
export function useRouter(): ImperativeRouter {
  const { isPreview } = usePreviewInfo();
  if (isPreview) {
    return routerWithWarnings;
  }
  return router;
}
