import { View } from 'react-native';

import { renderRouter } from '../../testing-library';
import { ScrollViewPathDetector } from '../../utils/ScrollViewPathDetector';
import Stack from '../Stack';

jest.mock('../../utils/ScrollViewPathDetector', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    ScrollViewPathDetector: jest.fn(() => React.createElement(View, { testID: 'detector' })),
  };
});

const MockedDetector = ScrollViewPathDetector as jest.MockedFunction<typeof ScrollViewPathDetector>;

type JsonNode = {
  type: string;
  props: Record<string, unknown>;
  children: (JsonNode | string)[] | null;
};

// Finds the host parent whose children include the element with `testID`. Host elements only, so
// the order of `children` is the order react-native-screens sees on the native side.
function findHostParentOf(node: JsonNode, testID: string): JsonNode | null {
  for (const child of node.children ?? []) {
    if (typeof child === 'string') continue;
    if (child.props.testID === testID) return node;
    const found = findHostParentOf(child, testID);
    if (found) return found;
  }
  return null;
}

it('renders the scroll view path detector after the screen content', () => {
  const { toJSON } = renderRouter({
    _layout: () => <Stack />,
    index: () => <View testID="content" />,
  });

  expect(MockedDetector.mock.calls[0]?.[0]).toEqual({ routeName: 'index' });

  // `toJSON` is a JsonNode tree, typed loosely by the testing library.
  const parent = findHostParentOf(toJSON() as JsonNode, 'content');
  const testIDs = (parent?.children ?? []).map((child) =>
    typeof child === 'string' ? child : child.props.testID
  );
  expect(testIDs.indexOf('detector')).toBeGreaterThan(testIDs.indexOf('content'));
});
