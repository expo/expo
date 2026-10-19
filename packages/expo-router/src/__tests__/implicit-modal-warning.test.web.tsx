/** @jest-environment jsdom */

import { act } from '@testing-library/react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter } from '../testing-library';

afterEach(() => {
  jest.restoreAllMocks();
});

test('does not warn about implicit modal presentation on web', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const result = await renderRouter({
    _layout: () => (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
      </Stack>
    ),
    index: () => null,
    sheet: () => null,
    target: () => null,
  });

  try {
    await act(() => router.push('/sheet'));
    await act(() => router.push('/target'));

    expect(warn).not.toHaveBeenCalled();
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});
