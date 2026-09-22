/** @jest-environment jsdom */
import { act, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { store } from '../global-state/router-store';
import { renderRouter } from '../testing-library';

/**
 * These tests cover browser-driven hash changes on web. The browser creates the history entry
 * itself when the user follows a plain `<a href="#heading">` anchor or presses Back/Forward.
 * Expo Router only learns about the change from the `popstate` event.
 *
 * The page must stay mounted: only the hash changed, so the focused route must keep its key.
 * A root reset remounts every screen, which the user sees as a page reload.
 */

let mountCount = 0;

function Post() {
  useEffect(() => {
    mountCount++;
  }, []);
  return <Text testID="post" />;
}

function getFocusedRouteKey(): string | undefined {
  const route = store.navigationRef.current?.getCurrentRoute() as { key?: string } | undefined;
  return route?.key;
}

/**
 * Simulates the browser following an in-page anchor such as `<a href="#heading">`.
 *
 * Per the HTML spec, a fragment navigation creates a new session history entry whose
 * `history.state` is `null`, and then fires `popstate` (followed by `hashchange`).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event#when_popstate_is_sent
 */
function followAnchor(hash: string) {
  const { pathname, search } = window.location;
  window.history.pushState(null, '', `${pathname}${search}${hash}`);
  window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
}

/**
 * Simulates the browser Back button landing on an earlier entry. The browser restores that
 * entry's URL and `history.state`, then fires `popstate`.
 */
function traverseTo(entryState: unknown, url: string) {
  window.history.pushState(entryState, '', url);
  window.dispatchEvent(new PopStateEvent('popstate', { state: entryState }));
}

beforeEach(() => {
  mountCount = 0;
  // jsdom keeps one window per test file; start every test from a clean URL and history state.
  window.history.replaceState(null, '', '/');
});

/**
 * Runs a browser history event and lets Expo Router finish reacting to it. `useLinking` writes the
 * resulting entry back to `window.history` in a promise queue, so the flush needs an async act.
 */
async function browserEvent(fire: () => void) {
  await act(async () => {
    fire();
  });
}

function renderPost() {
  renderRouter(
    {
      index: () => <Text testID="index" />,
      post: Post,
    },
    { initialUrl: '/post' }
  );
  // `renderRouter` enables fake timers for deterministic dates. These tests only need real
  // promise scheduling, and the testing library's cleanup hangs under fake timers in jsdom.
  jest.useRealTimers();
}

it('keeps the page mounted when the browser follows two anchors on the same page', async () => {
  renderPost();

  expect(screen).toHavePathnameWithParams('/post');
  expect(window.location.pathname).toBe('/post');
  const initialKey = getFocusedRouteKey();
  expect(initialKey).toBeDefined();
  expect(mountCount).toBe(1);

  // <a href="#a">
  await browserEvent(() => followAnchor('#a'));
  expect(window.location.hash).toBe('#a');
  expect(screen).toHavePathnameWithParams('/post#a');
  expect(mountCount).toBe(1);
  expect(getFocusedRouteKey()).toBe(initialKey);

  // <a href="#b">
  await browserEvent(() => followAnchor('#b'));
  expect(window.location.hash).toBe('#b');
  expect(screen).toHavePathnameWithParams('/post#b');
  expect(mountCount).toBe(1);
  expect(getFocusedRouteKey()).toBe(initialKey);
});

it('keeps the page mounted when the browser goes back from a hash entry to the page', async () => {
  renderPost();

  expect(screen).toHavePathnameWithParams('/post');
  const initialKey = getFocusedRouteKey();
  // Expo Router tags the entry it is tracking with `{ id }`.
  const initialEntryState = window.history.state;
  expect(initialEntryState).toEqual({ id: expect.any(String) });

  // <a href="#a">
  await browserEvent(() => followAnchor('#a'));
  expect(screen).toHavePathnameWithParams('/post#a');
  expect(mountCount).toBe(1);
  expect(getFocusedRouteKey()).toBe(initialKey);

  // Browser Back: returns to the entry Expo Router created on load.
  await browserEvent(() => traverseTo(initialEntryState, '/post'));
  expect(window.location.hash).toBe('');
  expect(screen).toHavePathnameWithParams('/post');
  expect(mountCount).toBe(1);
  expect(getFocusedRouteKey()).toBe(initialKey);
});
