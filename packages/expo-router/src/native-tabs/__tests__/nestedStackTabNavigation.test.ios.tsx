import { screen } from '@testing-library/react-native';
import { act } from 'react';
import { Text } from 'react-native';

import { router } from '../../imperative-api';
import { Stack } from '../../layouts/Stack';
import { renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualModule,
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children }) => <View testID="TabsHost">{children}</View>),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
  };
});

// Regression guard for the getInitialState/self-seed removal (Step 6): warm-navigating from a root
// Stack into a NativeTabs level whose focused tab is itself a nested Stack must commit every slice on
// the path (root Stack → NativeTabs → faces Stack → [face]) via the compiler seed / PRELOAD subtree —
// no navigator may mount with a `null` slice now that the self-seed is gone.
test('warm-navigate into NativeTabs (under root Stack) with a nested stack tab', () => {
  renderRouter(
    {
      _layout: () => <Stack screenOptions={{ headerShown: false }} />,
      index: () => <Text testID="home">Home</Text>,
      'tabs/_layout': () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="faces" />
          <NativeTabs.Trigger name="dynamic" />
        </NativeTabs>
      ),
      'tabs/index': () => <Text testID="tabs-index">Tabs Index</Text>,
      'tabs/dynamic': () => <Text testID="tabs-dynamic">Tabs Dynamic</Text>,
      'tabs/faces/_layout': () => <Stack />,
      'tabs/faces/index': () => <Text testID="faces-index">Faces Index</Text>,
      'tabs/faces/[face]': () => <Text testID="face">Face</Text>,
    },
    { initialUrl: '/' }
  );

  expect(screen.getByTestId('home')).toBeVisible();

  act(() => router.navigate('/tabs/faces/1'));

  expect(screen).toHaveSegments(['tabs', 'faces', '[face]']);
});

const nestedTabsApp = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  index: () => <Text testID="home">Home</Text>,
  'tabs/_layout': () => (
    <NativeTabs>
      <NativeTabs.Trigger name="index" />
      <NativeTabs.Trigger name="faces" />
      <NativeTabs.Trigger name="dynamic" />
    </NativeTabs>
  ),
  'tabs/index': () => <Text testID="tabs-index">Tabs Index</Text>,
  'tabs/dynamic': () => <Text testID="tabs-dynamic">Tabs Dynamic</Text>,
  'tabs/faces/_layout': () => <Stack />,
  'tabs/faces/index': () => <Text testID="faces-index">Faces Index</Text>,
  'tabs/faces/[face]': () => <Text testID="face">Face</Text>,
};

test('cold deep-link into a nested stack tab of NativeTabs', () => {
  renderRouter(nestedTabsApp, { initialUrl: '/tabs/faces/1' });

  expect(screen).toHaveSegments(['tabs', 'faces', '[face]']);
});
