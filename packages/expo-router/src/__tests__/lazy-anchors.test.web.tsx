/** @jest-environment jsdom */

import { act } from '@testing-library/react-native';
import { Profiler } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { getMockContext, renderRouter, screen } from '../testing-library';
import type { FileStub } from '../testing-library/context-stubs';
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

it('keeps the server HTML while a deep-linked layout loads during hydration', async () => {
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const routes = (layout: FileStub) => ({
    index: () => null,
    'profile/_layout': layout,
    'profile/index': () => null,
    'profile/[id]': () => <Text testID="profile-id" />,
  });
  // Like `@expo/router-server`, the server renders the document element around the app.
  const document_ = document.createElement('div');
  document.body.appendChild(document_);
  document_.innerHTML = renderToString(
    <ExpoRoot
      context={getMockContext(
        routes({ unstable_settings: { anchor: 'index' }, default: () => <Slot /> })
      )}
      location="/profile/1"
      wrapper={({ children }) => <div id="root">{children}</div>}
    />
  );
  const container = document_.querySelector('#root')!;
  const layout = lazyModule({ unstable_settings: { anchor: 'index' }, default: () => <Slot /> });
  const onRecoverableError = jest.fn();

  const root = await act(async () =>
    hydrateRoot(
      container,
      <ExpoRoot context={getMockContext(routes(layout.load))} location="/profile/1" />,
      { onRecoverableError }
    )
  );

  try {
    expect(container.querySelectorAll('[data-testid="profile-id"]')).toHaveLength(1);

    await act(async () => layout.resolve());

    expect(container.querySelectorAll('[data-testid="profile-id"]')).toHaveLength(1);
    expect(onRecoverableError).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    document_.remove();
  }
});
