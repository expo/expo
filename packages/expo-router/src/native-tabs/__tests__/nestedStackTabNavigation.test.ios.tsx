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

// Switching to a tab that was never focused must not crash: the tab was committed with its compiled
// subtree by the PRELOAD wire (Step 6), so first-visit no longer relies on the removed self-seed.
test('switching to a never-focused tab commits its subtree', () => {
  renderRouter(nestedTabsApp, { initialUrl: '/tabs/faces/1' });
  expect(screen).toHaveSegments(['tabs', 'faces', '[face]']);

  act(() => router.navigate('/tabs/dynamic'));

  expect(screen).toHaveSegments(['tabs', 'dynamic']);
  expect(screen.getByTestId('tabs-dynamic')).toBeVisible();
});

// GO_BACK ascends across navigator boundaries one level at a time: from the nested leaf, backing out
// pops the faces Stack, then the NativeTabs, then the root Stack — back to the root screen.
test('backing out ascends across navigator boundaries (faces Stack → NativeTabs → root Stack)', () => {
  renderRouter(nestedTabsApp, { initialUrl: '/' });
  expect(screen.getByTestId('home')).toBeVisible();

  act(() => router.push('/tabs'));
  act(() => router.push('/tabs/faces/1'));
  expect(screen).toHavePathname('/tabs/faces/1');

  act(() => router.back()); // faces Stack: [face] → faces index
  expect(screen).toHavePathname('/tabs/faces');

  act(() => router.back()); // ascend faces Stack → NativeTabs
  expect(screen).toHavePathname('/tabs');

  act(() => router.back()); // ascend NativeTabs → root Stack
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
});
