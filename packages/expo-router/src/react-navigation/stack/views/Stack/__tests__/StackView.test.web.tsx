/** @jest-environment jsdom */
import { act, render, screen } from '@testing-library/react';
import { View } from 'react-native';

import { ExpoRoot } from '../../../../../ExpoRoot';
import { router } from '../../../../../imperative-api';
import JSStack from '../../../../../layouts/JSStack';
import { getMockContext } from '../../../../../testing-library/mock-config';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

it('marks the card and floating header the user left as inert', () => {
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const context = getMockContext({
    _layout: () => (
      <JSStack
        screenOptions={{
          headerMode: 'float',
          header: ({ route }) => <View testID={`header-${route.name}`} />,
        }}
      />
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });
  render(<ExpoRoot context={context} location="/" />);

  act(() => router.push('/second'));

  expect(screen.getByTestId('index').closest('[inert]')).not.toBeNull();
  expect(screen.getByTestId('header-index').closest('[inert]')).not.toBeNull();
  expect(screen.getByTestId('second').closest('[inert]')).toBeNull();
  expect(screen.getByTestId('header-second').closest('[inert]')).toBeNull();
});
