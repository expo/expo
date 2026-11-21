import * as ReactNative from 'react-native';

export type VerticalBarEdgeIOS = 'leading' | 'trailing';

/**
 * The screen edge iPhone Duo's vertical bar sits on, or null when the status bar runs across the top.
 */
export const useVerticalBarEdgeIOS: () => VerticalBarEdgeIOS | null =
  // The legacy React Native typings this package compiles against don't declare the hook.
  (ReactNative as unknown as { useVerticalBarEdgeIOS: () => VerticalBarEdgeIOS | null })
    .useVerticalBarEdgeIOS;
