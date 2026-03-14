import React from 'react';
import { Platform, Text } from 'react-native';
import { Split } from 'react-native-screens/experimental';

import { renderRouter, screen } from '../../testing-library';
import { SplitView } from '../split-view';

// Mock Platform.isPad = true for iPad tests
beforeAll(() => {
  Object.defineProperty(Platform, 'isPad', { get: () => true });
});

jest.mock('react-native-screens/experimental', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens/experimental'
  ) as typeof import('react-native-screens/experimental');
  return {
    ...actualModule,
    Split: {
      ...actualModule.Split,
      Host: jest.fn(({ children }) => <View testID="SplitHost">{children}</View>),
      Column: jest.fn(({ children }) => <View testID="SplitColumn">{children}</View>),
      Inspector: jest.fn(({ children }) => <View testID="SplitInspector">{children}</View>),
    },
  };
});

const MockedSplitHost = Split.Host as jest.MockedFunction<typeof Split.Host>;

describe('SplitView on iPad', () => {
  beforeEach(() => {
    (MockedSplitHost as jest.Mock).mockClear();
  });

  it('renders Split.Host on iPad (regression)', () => {
    renderRouter(
      {
        _layout: () => (
          <SplitView>
            <SplitView.Column>
              <Text>Primary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('SplitHost')).toBeVisible();
  });
});
