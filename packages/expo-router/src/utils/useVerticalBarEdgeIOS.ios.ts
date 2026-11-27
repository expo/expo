import { useVerticalBarEdgeIOS as useCoreVerticalBarEdgeIOS } from 'react-native';

import type { VerticalBarEdgeIOS } from './useVerticalBarEdgeIOS';

export function useVerticalBarEdgeIOS(): VerticalBarEdgeIOS | null {
  return useCoreVerticalBarEdgeIOS() ?? null;
}
