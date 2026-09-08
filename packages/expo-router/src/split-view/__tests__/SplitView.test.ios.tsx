import { screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { Split } from 'react-native-screens/experimental';

import { renderRouter } from '../../testing-library';
import { SplitView } from '../index';

jest.mock('react-native-screens/experimental', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const actual = jest.requireActual<typeof import('react-native-screens/experimental')>(
    'react-native-screens/experimental'
  );

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

const SplitHost = jest.mocked(Split.Host);

beforeEach(() => {
  SplitHost.mockClear();
});

it('renders split view content and passes host options through', () => {
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

  expect(SplitHost.mock.calls[0]?.[0]).toEqual(
    expect.objectContaining({ preferredDisplayMode: 'twoBesideSecondary' })
  );
});
