import { act, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';

import type { ReactNavigationState } from '../global-state/types';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { usePreventRemove } from '../react-navigation/native';
import { renderRouter } from '../testing-library';

const workflowRoutes = {
  _layout: () => <Stack />,
  index: () => <Text testID="index" />,
  'workflow/_layout': () => <Stack />,
  'workflow/step1': () => <Text testID="step1" />,
  'workflow/step2': () => <Text testID="step2" />,
  'workflow/step3': () => <Text testID="step3" />,
};

// Route names of each navigator on the focused path, starting below the hidden root route.
function getFocusedRouteNames(state: ReactNavigationState | undefined): string[][] {
  const names: string[][] = [];
  let current = state?.routes[0]?.state;
  while (current) {
    names.push(current.routes.map((route) => route.name));
    current = current.routes[current.index ?? current.routes.length - 1]?.state;
  }
  return names;
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
});

it('replaces the history and focuses the last route', async () => {
  await renderRouter(workflowRoutes);

  await act(() =>
    router.reset({
      routes: [
        { name: 'index' },
        {
          name: 'workflow',
          state: {
            routes: [{ name: 'step1' }, { name: 'step2' }, { name: 'step3', params: { id: '42' } }],
          },
        },
      ],
    })
  );

  expect(screen).toHavePathnameWithParams('/workflow/step3?id=42');
  await act(() => router.back());
  expect(screen).toHavePathname('/workflow/step2');
  await act(() => router.back());
  expect(screen).toHavePathname('/workflow/step1');
  await act(() => router.back());
  expect(screen).toHavePathname('/');
});

it('adds the layout anchor below the given routes', async () => {
  const result = await renderRouter({
    ...workflowRoutes,
    'workflow/_layout': { unstable_settings: { anchor: 'step1' }, default: () => <Stack /> },
  });

  await act(() =>
    router.reset({ routes: [{ name: 'workflow', state: { routes: [{ name: 'step3' }] } }] })
  );

  expect(getFocusedRouteNames(result.getRouterState())).toEqual([['workflow'], ['step1', 'step3']]);
});

it('does not duplicate an anchor that is already given', async () => {
  const result = await renderRouter({
    ...workflowRoutes,
    'workflow/_layout': { unstable_settings: { anchor: 'step1' }, default: () => <Stack /> },
  });

  await act(() =>
    router.reset({
      routes: [{ name: 'workflow', state: { routes: [{ name: 'step1' }, { name: 'step3' }] } }],
    })
  );

  expect(getFocusedRouteNames(result.getRouterState())).toEqual([['workflow'], ['step1', 'step3']]);
});

it('keeps a given route named like its group when the anchor is another route', async () => {
  const result = await renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    '(home)/_layout': { unstable_settings: { anchor: 'dashboard' }, default: () => <Stack /> },
    '(home)/home': () => null,
    '(home)/dashboard': () => null,
    '(home)/details': () => null,
  });

  await act(() =>
    router.reset({
      routes: [{ name: '(home)', state: { routes: [{ name: 'home' }, { name: 'details' }] } }],
    })
  );

  expect(getFocusedRouteNames(result.getRouterState())).toEqual([
    ['(home)'],
    ['dashboard', 'home', 'details'],
  ]);
});

it('skips unknown routes and warns', async () => {
  const result = await renderRouter(workflowRoutes);

  await act(() =>
    router.reset({
      routes: [
        { name: 'missing' },
        { name: 'workflow', state: { routes: [{ name: 'step1' }, { name: 'nope' }] } },
      ],
    })
  );

  expect(getFocusedRouteNames(result.getRouterState())).toEqual([['workflow'], ['step1']]);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('"missing"'));
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('"nope"'));
});

it('uses the default state of a layout whose given routes are all unknown', async () => {
  const result = await renderRouter({
    ...workflowRoutes,
    'workflow/_layout': { unstable_settings: { anchor: 'step2' }, default: () => <Stack /> },
  });

  await act(() =>
    router.reset({ routes: [{ name: 'workflow', state: { routes: [{ name: 'nope' }] } }] })
  );

  expect(getFocusedRouteNames(result.getRouterState())).toEqual([['workflow'], ['step2']]);
});

it('ignores state on a route that is not a layout and warns', async () => {
  const result = await renderRouter(workflowRoutes);

  await act(() =>
    router.reset({ routes: [{ name: 'index', state: { routes: [{ name: 'step1' }] } }] })
  );

  expect(getFocusedRouteNames(result.getRouterState())).toEqual([['index']]);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('"index"'));
});

it('does nothing and warns when no top-level route is known', async () => {
  const result = await renderRouter(workflowRoutes, { initialUrl: '/workflow/step2' });
  const state = result.getRouterState();

  await act(() => router.reset({ routes: [{ name: 'missing' }] }));

  expect(result.getRouterState()).toBe(state);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('"missing"'));
});

it('remounts a screen that is reset to the same route with other params', async () => {
  const unmount = jest.fn();
  const result = await renderRouter(
    {
      _layout: () => <Stack />,
      item: function Item() {
        useEffect(() => unmount, []);
        return null;
      },
    },
    { initialUrl: '/item?id=1' }
  );
  const keyBefore = result.getRouterState()!.routes[0]!.state!.routes[0]!.key;

  await act(() => router.reset({ routes: [{ name: 'item', params: { id: '2' } }] }));

  expect(screen).toHavePathnameWithParams('/item?id=2');
  expect(result.getRouterState()!.routes[0]!.state!.routes[0]!.key).not.toBe(keyBefore);
  expect(unmount).toHaveBeenCalledTimes(1);
});

it('is blocked by usePreventRemove on a screen that the reset removes', async () => {
  const onPrevent = jest.fn();
  await renderRouter({
    ...workflowRoutes,
    second: function Second() {
      usePreventRemove(true, onPrevent);
      return null;
    },
  });
  await act(() => router.push('/second'));

  await act(() => router.reset({ routes: [{ name: 'index' }] }));

  expect(onPrevent).toHaveBeenCalledTimes(1);
  expect(screen).toHavePathname('/second');
});

it('resets from a not-found initial URL', async () => {
  const result = await renderRouter(workflowRoutes, { initialUrl: '/does-not-exist' });
  expect(result.getRouterState()!.routes.map((route) => route.name)).toEqual(['+not-found']);

  await act(() =>
    router.reset({
      routes: [
        { name: 'index' },
        { name: 'workflow', state: { routes: [{ name: 'step1' }, { name: 'step2' }] } },
      ],
    })
  );

  expect(screen).toHavePathname('/workflow/step2');
  await act(() => router.back());
  expect(screen).toHavePathname('/workflow/step1');
  await act(() => router.back());
  expect(screen).toHavePathname('/');
});
