import { screen } from '@testing-library/react-native';

export const HORIZONTAL_EDGES = { top: 'off', right: 'additive', bottom: 'off', left: 'additive' };

// Edges of every `SafeAreaView` from `react-native-safe-area-context` above the element.
export function getSafeAreaViewEdges(testID: string) {
  const edges: { left?: string }[] = [];
  let node = screen.getByTestId(testID, { includeHiddenElements: true });
  while (node.parent) {
    node = node.parent;
    if (node.type === 'RNCSafeAreaView') {
      edges.push(node.props.edges);
    }
  }
  return edges;
}
