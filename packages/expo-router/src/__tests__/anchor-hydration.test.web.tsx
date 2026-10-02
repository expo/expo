/** @jest-environment jsdom */
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { navigationRef } from '../global-state/navigationRef';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { inMemoryContext } from '../testing-library/context-stubs';

// The browser build of `react-dom/server` needs `MessageChannel`, which jsdom does not provide.
const { renderToString } = require('react-dom/server.node') as typeof import('react-dom/server');

// Enables `act` for `hydrateRoot`, which does not go through React Native Testing Library.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// The web header measures itself, and jsdom has no `ResizeObserver`.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

const context = inMemoryContext({
  _layout: () => <Stack />,
  index: () => <Text testID="index">index</Text>,
  'profile/_layout': {
    unstable_settings: { anchor: 'index' },
    default: () => <Stack />,
  },
  'profile/index': () => <Text testID="profile">profile</Text>,
  'profile/[id]': () => <Text testID="profile-id">profile id</Text>,
});

it('hydrates a deep link into a nested stack with its anchor', async () => {
  const location = new URL('http://localhost/profile/1');
  const html = renderToString(<ExpoRoot context={context} location={location} />);
  expect(html).toContain('aria-label="index, back"');
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  window.history.replaceState(null, '', '/profile/1');
  const recoverableErrors: unknown[] = [];

  await act(async () => {
    hydrateRoot(container, <ExpoRoot context={context} location={location} />, {
      onRecoverableError: (error) => recoverableErrors.push(error),
    });
  });

  expect(recoverableErrors).toEqual([]);
  expect(container.innerHTML).toContain('aria-label="index, back"');
  expect(router.canGoBack()).toBe(true);

  await act(() => router.back());

  expect(getRouteInfoFromState(navigationRef.getRootState()).pathname).toBe('/profile');
});
