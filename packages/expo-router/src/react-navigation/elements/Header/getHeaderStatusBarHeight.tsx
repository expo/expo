import type { VerticalBarEdgeIOS } from 'expo-status-bar';
import type { EdgeInsets } from 'react-native-safe-area-context';

// With the status bar in iPhone Duo's vertical bar, the top inset is 0, while UIKit still places
// navigation bars this far below the top edge. No native API reports this offset.
const VERTICAL_BAR_STATUS_BAR_HEIGHT = 24;

export function getHeaderStatusBarHeight(
  insets: EdgeInsets,
  verticalBarEdge: VerticalBarEdgeIOS | null
): number {
  return insets.top === 0 && verticalBarEdge != null ? VERTICAL_BAR_STATUS_BAR_HEIGHT : insets.top;
}
