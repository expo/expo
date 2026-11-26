import * as ReactNative from 'react-native';

import type { VerticalBarEdgeIOS } from './useVerticalBarEdgeIOS';

export const useVerticalBarEdgeIOS: () => VerticalBarEdgeIOS | null =
  // The legacy React Native typings this package compiles against don't declare the hook.
  (ReactNative as unknown as { useVerticalBarEdgeIOS: () => VerticalBarEdgeIOS | null })
    .useVerticalBarEdgeIOS;
