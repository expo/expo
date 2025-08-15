import React from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { act, renderRouter, screen } from '../testing-library';

/**
 * Basic sanity check: a stack containing a mix of normal and modal screens
 * should behave the same on native (iOS) as any regular stack. We verify that
 * pushing the modal route updates the pathname and enables `canDismiss()`.
 */
it('native stack handles mixed modal + normal screens', () => {
  renderRouter({
    _layout: () => (
      <Stack id={undefined}>
        <Stack.Screen name="index" />
        <Stack.Screen name="second" options={{ presentation: 'modal' }} />
      </Stack>
    ),
    index: () => <Text testID="index" />, // regular screen
    second: () => <Text testID="modal" />, // modal screen
  });

  // Starts at the root route.
  expect(screen).toHavePathname('/');
  expect(router.canDismiss()).toBe(false);

  // Push the modal route and ensure navigation works.
  act(() => router.push('/second'));

  expect(screen).toHavePathname('/second');
  expect(router.canDismiss()).toBe(true);
  // Modal content should now be visible.
  expect(screen.getByTestId('modal')).toBeTruthy();
});
