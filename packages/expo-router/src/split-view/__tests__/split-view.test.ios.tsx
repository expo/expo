import { screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { IsWithinNativeNavigator } from '../../exports';
import JSStack from '../../layouts/JSStack';
import Stack from '../../layouts/StackClient';
import { renderRouter } from '../../testing-library';
import { Slot } from '../../views/Navigator';
import { SplitView } from '../split-view';

jest.mock('react-native-screens/experimental', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-screens/experimental'
  ) as typeof import('react-native-screens/experimental');

  return {
    ...actual,
    Split: {
      ...actual.Split,
      Host: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Host">{children}</View>
      )),
      Column: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Column">{children}</View>
      )),
    },
  };
});

const SplitLayout = () => (
  <SplitView>
    <SplitView.Column />
  </SplitView>
);

it('renders a SplitView nested under Slot', () => {
  renderRouter(
    {
      _layout: () => <Slot />,
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('renders a SplitView nested under the default navigator', () => {
  renderRouter(
    {
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('rejects a SplitView nested under a native navigator', () => {
  expect(() =>
    renderRouter(
      {
        _layout: () => <Stack />,
        'nested/_layout': SplitLayout,
        'nested/index': () => <Text>Child</Text>,
      },
      { initialUrl: '/nested' }
    )
  ).toThrow('SplitView cannot be used inside another native navigator.');
});

it('rejects a SplitView nested under a custom native navigator', () => {
  expect(() =>
    renderRouter(
      {
        _layout: () => (
          <IsWithinNativeNavigator value>
            <Slot />
          </IsWithinNativeNavigator>
        ),
        'nested/_layout': SplitLayout,
        'nested/index': () => <Text>Child</Text>,
      },
      { initialUrl: '/nested' }
    )
  ).toThrow('SplitView cannot be used inside another native navigator.');
});

it('rejects a SplitView nested inside a SplitView column', () => {
  expect(() =>
    renderRouter({
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <SplitLayout />
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    })
  ).toThrow('SplitView cannot be used inside another native navigator.');
});

it('renders a SplitView nested under a JavaScript navigator', () => {
  renderRouter(
    {
      _layout: () => <JSStack />,
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});
