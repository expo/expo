import type { StatusBarVerticalBarEdgeIOS } from 'react-native';

export type VerticalBarEdgeIOS = StatusBarVerticalBarEdgeIOS;

/**
 * The screen edge iPhone Duo's vertical bar sits on, or null when the status bar runs across the top.
 */
export function useVerticalBarEdgeIOS(): VerticalBarEdgeIOS | null {
  return null;
}
