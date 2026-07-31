import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { useHeaderHeight } from '../react-navigation/elements';
import { renderRouter } from '../testing-library';

const HeaderHeight = () => <Text testID="header-height">{useHeaderHeight()}</Text>;

const getHeaderHeight = () => screen.getByTestId('header-height').props.children;

it('reports the iOS header height', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: HeaderHeight,
  });

  expect(getHeaderHeight()).toBe(44);
});

it('reports the modal header height', () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    ),
    index: HeaderHeight,
    modal: HeaderHeight,
  });

  expect(getHeaderHeight()).toBe(44);
  act(() => router.push('/modal'));
  expect(getHeaderHeight()).toBe(56);
});

it('reports the height for a transparent header', () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={{ headerTransparent: true }} />
        <Stack.Screen name="modal" options={{ headerTransparent: true, presentation: 'modal' }} />
      </Stack>
    ),
    index: HeaderHeight,
    modal: HeaderHeight,
  });

  expect(getHeaderHeight()).toBe(44);
  act(() => router.push('/modal'));
  expect(getHeaderHeight()).toBe(56);
});

it('updates the height when navigating from a hidden to a shown header', () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="shown" />
      </Stack>
    ),
    index: HeaderHeight,
    shown: HeaderHeight,
  });

  expect(getHeaderHeight()).toBe(0);
  act(() => router.push('/shown'));
  expect(getHeaderHeight()).toBe(44);
});

it('inherits the parent height when a nested header is hidden', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    'nested/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
    'nested/index': HeaderHeight,
  });

  act(() => router.push('/nested'));
  expect(getHeaderHeight()).toBe(44);
});

it('reports zero when parent and nested headers are hidden', () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="nested" options={{ headerShown: false }} />
      </Stack>
    ),
    index: () => null,
    'nested/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
    'nested/index': HeaderHeight,
  });

  act(() => router.push('/nested'));
  expect(getHeaderHeight()).toBe(0);
});
