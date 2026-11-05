/** @jest-environment jsdom */
import { act, render, screen } from '@testing-library/react';
import { View } from 'react-native';

import { ExpoRoot } from '../../../ExpoRoot';
import { router } from '../../../imperative-api';
import { Stack } from '../../../layouts/Stack';
import { Tabs } from '../../../layouts/Tabs';
import { getMockContext } from '../../../testing-library/mock-config';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

it('marks the stack screen the user left as inert', () => {
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const context = getMockContext({
    _layout: () => <Stack />,
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });
  render(<ExpoRoot context={context} location="/" />);

  act(() => router.push('/second'));

  expect(screen.getByTestId('index').closest('[inert]')).not.toBeNull();
  expect(screen.getByTestId('second').closest('[inert]')).toBeNull();
});

it('marks the tab the user left as inert', () => {
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const context = getMockContext({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });
  render(<ExpoRoot context={context} location="/" />);

  act(() => router.push('/second'));

  expect(screen.getByTestId('index').closest('[inert]')).not.toBeNull();
  expect(screen.getByTestId('second').closest('[inert]')).toBeNull();
});
