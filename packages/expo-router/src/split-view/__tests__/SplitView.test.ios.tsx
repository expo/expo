import { screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { Split } from 'react-native-screens/experimental';

import { renderRouter } from '../../testing-library';
import { SplitView } from '../split-view';

jest.mock('react-native-screens/experimental', () => {
  const { View } = jest.requireActual('react-native') as typeof import('react-native');
  const actual = jest.requireActual(
    'react-native-screens/experimental'
  ) as typeof import('react-native-screens/experimental');

  return {
    ...actual,
    Split: {
      ...actual.Split,
      Host: jest.fn(({ children }) => <View testID="split-host">{children}</View>),
      Column: jest.fn(({ children }) => <View testID="split-column">{children}</View>),
      Inspector: jest.fn(({ children }) => <View testID="split-inspector">{children}</View>),
    },
  };
});

const SplitHost = Split.Host as jest.MockedFunction<typeof Split.Host>;
const SplitColumn = Split.Column as jest.MockedFunction<typeof Split.Column>;
const SplitInspector = Split.Inspector as jest.MockedFunction<typeof Split.Inspector>;

beforeEach(() => {
  SplitHost.mockClear();
  SplitColumn.mockClear();
  SplitInspector.mockClear();
});

it('renders through the public split-view entry and passes host options through', () => {
  renderRouter({
    _layout: () => (
      <SplitView preferredDisplayMode="twoBesideSecondary">
        <SplitView.Column>
          <View testID="sidebar" />
        </SplitView.Column>
        <SplitView.Inspector>
          <View testID="inspector" />
        </SplitView.Inspector>
      </SplitView>
    ),
    index: () => <Text testID="content">Content</Text>,
  });

  expect(screen.getByTestId('sidebar')).toBeVisible();
  expect(screen.getByTestId('content')).toBeVisible();
  expect(screen.getByTestId('inspector')).toBeVisible();

  expect(SplitHost).toHaveBeenCalledWith(
    expect.objectContaining({
      preferredDisplayMode: 'twoBesideSecondary',
    }),
    undefined
  );
  expect(SplitColumn).toHaveBeenCalled();
  expect(SplitInspector).toHaveBeenCalled();
});
