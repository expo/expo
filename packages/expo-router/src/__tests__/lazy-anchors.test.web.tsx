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
    // Adds a browser history entry that `history.back()` can leave.
    await act(() => router.push('/other'));
    // Waits for the profile layout to read its anchor, so the navigation does not happen yet.
    await act(() => router.push('/profile/1'));

    expect(screen).toHavePathname('/other');

    await act(async () => {
      window.history.back();
      await jest.runAllTimersAsync();
    });

    expect(screen).toHavePathname('/');

    await act(async () => layout.resolve());

    // The waiting push to `/profile/1` is dropped after the layout loads.
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

function profileRoutes(layout: FileStub) {
  return {
    index: () => null,
    'profile/_layout': layout,
    'profile/index': () => null,
    'profile/[id]': () => <Text testID="profile-id" />,
  };
}

const profileLayout = { unstable_settings: { anchor: 'index' }, default: () => <Slot /> };

/** Renders `/profile/1` to HTML like `@expo/router-server` and returns the app's root element. */
function renderServerHtml() {
  // The server renders the document element around the app, so the app is not the body's child.
  const document_ = document.createElement('div');
  document.body.appendChild(document_);
  document_.innerHTML = renderToString(
    <ExpoRoot
      context={getMockContext(profileRoutes(profileLayout))}
      location="/profile/1"
      wrapper={({ children }) => <div id="root">{children}</div>}
    />
  );
  return { document_, container: document_.querySelector('#root')! };
}

function countProfileIds(container: Element) {
  return container.querySelectorAll('[data-testid="profile-id"]').length;
}

it('keeps the server HTML while a deep-linked layout loads during hydration', async () => {
  // The server loads routes synchronously, so it renders the layout without waiting.
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const { document_, container } = renderServerHtml();
  // The client loads the same layout lazily.
  const layout = lazyModule(profileLayout);
  const onRecoverableError = jest.fn();

  const root = await act(async () =>
    hydrateRoot(
      container,
      <ExpoRoot context={getMockContext(profileRoutes(layout.load))} location="/profile/1" />,
      { onRecoverableError }
    )
  );

  try {
    // While the layout loads, the server HTML stays on screen.
    expect(countProfileIds(container)).toBe(1);

    await act(async () => layout.resolve());

    // Hydration finishes without a mismatch and without rendering the screen twice.
    expect(countProfileIds(container)).toBe(1);
    expect(onRecoverableError).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    document_.remove();
  }
});
