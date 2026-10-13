/** @jest-environment jsdom */

import { act } from '@testing-library/react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter, screen } from '../testing-library';

it('replaces the current browser entry', async () => {
  const result = await renderRouter({
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    index: () => null,
    other: () => null,
    'workflow/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
    'workflow/step1': () => null,
    'workflow/step2': () => null,
  });

  try {
    await act(() => router.push('/other'));
    const historyLength = window.history.length;

    await act(() =>
      router.reset({
        routes: [
          { name: 'index' },
          { name: 'workflow', state: { routes: [{ name: 'step1' }, { name: 'step2' }] } },
        ],
      })
    );

    expect(window.location.pathname).toBe('/workflow/step2');
    expect(window.history.length).toBe(historyLength);

    await act(async () => {
      window.history.back();
      await jest.runAllTimersAsync();
    });

    expect(screen).toHavePathname('/');
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});
