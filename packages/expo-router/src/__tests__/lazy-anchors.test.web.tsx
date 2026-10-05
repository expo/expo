/** @jest-environment jsdom */

import { act } from '@testing-library/react-native';
import { Profiler } from 'react';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter, screen } from '../testing-library';
import { Slot } from '../views/Navigator';
import { lazyModule } from './lazyModule';

it('drops a navigation that waits for a layout when the browser goes back', async () => {
  const layout = lazyModule({ unstable_settings: { anchor: 'index' }, default: () => <Slot /> });
  const result = await renderRouter({
    index: () => null,
    other: () => null,
    'profile/_layout': layout.load,
    'profile/index': () => null,
    'profile/[id]': () => null,
  });

  try {
    await act(() => router.push('/other'));
    await act(() => router.push('/profile/1'));

    expect(screen).toHavePathname('/other');

    await act(async () => {
      window.history.back();
      await jest.runAllTimersAsync();
    });

    expect(screen).toHavePathname('/');

    await act(async () => layout.resolve());

    expect(screen).toHavePathname('/');
    expect(window.location.pathname).toBe('/');
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});

it('waits for a deep-linked layout and mounts it once with its anchor', async () => {
  const onRender = jest.fn();
  const layout = lazyModule({
    unstable_settings: { anchor: 'index' },
    default: () => (
      <Profiler id="profile" onRender={onRender}>
        <Stack screenOptions={{ headerShown: false }} />
      </Profiler>
    ),
  });
  const result = await renderRouter(
    {
      index: () => null,
      'profile/_layout': layout.load,
      'profile/index': () => null,
      'profile/[id]': () => null,
    },
    { initialUrl: '/profile/1' }
  );

  try {
    expect(onRender).not.toHaveBeenCalled();

    await act(async () => layout.resolve());

    expect(screen).toHavePathname('/profile/1');
    expect(onRender.mock.calls.map(([, phase]) => phase)).toEqual(['mount']);

    await act(() => router.back());

    expect(screen).toHavePathname('/profile');
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});
