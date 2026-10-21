import { act, screen } from '@testing-library/react-native';
import { Component, Profiler, type PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { navigationRef } from '../global-state/navigationRef';
import { useIsNavigating } from '../global-state/useIsNavigating';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter } from '../testing-library';
import type { FileStub } from '../testing-library/context-stubs';
import { lazyModule } from './lazyModule';

it('does not read the anchor of a layout that is not shown', async () => {
  const readSettings = jest.fn(() => ({ anchor: 'index' }));
  await renderRouter({
    index: () => <Text testID="index" />,
    'profile/_layout': {
      get unstable_settings() {
        return readSettings();
      },
      default: () => <Stack />,
    },
    'profile/index': () => <Text testID="profile-index" />,
    'profile/[id]': () => <Text testID="profile-id" />,
  });

  expect(readSettings).not.toHaveBeenCalled();

  await act(() => router.push('/profile/1', { withAnchor: true }));
  await act(() => router.back());

  expect(screen.getByTestId('profile-index')).toBeVisible();
});

it('mounts a deep-linked stack once with its anchor', async () => {
  const onRender = jest.fn();
  await renderRouter(
    {
      index: () => <Text testID="index" />,
      'profile/_layout': {
        unstable_settings: { anchor: 'index' },
        default: () => (
          <Profiler id="profile" onRender={onRender}>
            <Stack />
          </Profiler>
        ),
      },
      'profile/index': () => <Text testID="profile-index" />,
      'profile/[id]': () => <Text testID="profile-id" />,
    },
    { initialUrl: '/profile/1' }
  );

  expect(onRender.mock.calls.map(([, phase]) => phase)).toEqual(['mount']);

  await act(() => router.back());

  expect(screen.getByTestId('profile-index')).toBeVisible();
});

describe('a group layout whose anchor is not named like the group', () => {
  const routes = {
    '(a)/_layout': {
      unstable_settings: { anchor: 'b' },
      default: () => <Stack />,
    },
    '(a)/a': () => <Text testID="a" />,
    '(a)/b': () => <Text testID="b" />,
    '(a)/c': () => <Text testID="c" />,
  };

  function stackRouteNames(result: Awaited<ReturnType<typeof renderRouter>>) {
    return result
      .getRouterState()!
      .routes[0]!.state!.routes[0]!.state!.routes.map(({ name }) => name);
  }

  it('deep links with only the anchor from settings', async () => {
    const result = await renderRouter(routes, { initialUrl: '/c' });

    expect(stackRouteNames(result)).toEqual(['b', 'c']);

    await act(() => router.back());

    expect(screen.getByTestId('b')).toBeVisible();
  });

  it('deep links to the route named like the group', async () => {
    const result = await renderRouter(routes, { initialUrl: '/a' });

    expect(stackRouteNames(result)).toEqual(['b', 'a']);
  });
});

it('gives a deep-linked anchor the path params of its target', async () => {
  const result = await renderRouter(
    {
      index: () => null,
      '[user]/_layout': {
        unstable_settings: { anchor: 'index' },
        default: () => <Stack />,
      },
      '[user]/index': () => null,
      '[user]/[post]': () => null,
    },
    { initialUrl: '/alice/42?sort=new' }
  );

  const userState = result.getRouterState()!.routes[0]!.state!.routes[0]!.state!;
  expect(userState.routes.map(({ name, params }) => ({ name, params }))).toEqual([
    { name: 'index', params: { user: 'alice', post: '42' } },
    { name: '[post]', params: { user: 'alice', post: '42', sort: 'new' } },
  ]);
});

class CatchError extends Component<PropsWithChildren, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <Text testID="error">{this.state.error.message}</Text>
    ) : (
      this.props.children
    );
  }
}

describe('layouts that are not loaded yet', () => {
  function profileRoutes(layout: FileStub) {
    return {
      index: function Index() {
        return <Text testID="index">{String(useIsNavigating())}</Text>;
      },
      other: () => <Text testID="other" />,
      'profile/_layout': layout,
      'profile/index': () => <Text testID="profile-index" />,
      'profile/[id]': () => <Text testID="profile-id" />,
    };
  }

  function profileLayout(onRender = jest.fn(), options?: { native?: boolean }) {
    return lazyModule(
      {
        unstable_settings: { anchor: 'index' },
        default: () => (
          <Profiler id="profile" onRender={onRender}>
            <Stack />
          </Profiler>
        ),
      },
      options
    );
  }

  it.each([false, true])(
    'waits for a deep-linked layout and mounts it once with its anchor (native: %s)',
    async (native) => {
      const onRender = jest.fn();
      const layout = profileLayout(onRender, { native });
      await renderRouter(profileRoutes(layout.load), { initialUrl: '/profile/1' });

      expect(screen.queryByTestId('profile-id')).toBeNull();

      await act(async () => layout.resolve());

      expect(screen.getByTestId('profile-id')).toBeVisible();
      expect(onRender.mock.calls.map(([, phase]) => phase)).toEqual(['mount']);

      await act(() => router.back());

      expect(screen.getByTestId('profile-index')).toBeVisible();
    }
  );

  it.each([false, true])(
    'keeps the current screen until a pushed layout loads (native: %s)',
    async (native) => {
      const onRender = jest.fn();
      const layout = profileLayout(onRender, { native });
      await renderRouter(profileRoutes(layout.load));

      await act(() => router.push('/profile/1', { withAnchor: true }));

      expect(screen.getByTestId('index')).toHaveTextContent('true');

      await act(async () => layout.resolve());

      expect(screen.getByTestId('profile-id')).toBeVisible();
      expect(onRender.mock.calls.map(([, phase]) => phase)).toEqual(['mount']);

      await act(() => router.back());

      expect(screen.getByTestId('profile-index')).toBeVisible();
    }
  );

  it('applies a navigation without the anchor when the layout fails to load', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const layout = profileLayout(undefined, { native: true });
    await renderRouter(profileRoutes(layout.load));

    await act(() => router.push('/profile/1', { withAnchor: true }));
    await act(async () => layout.reject(new Error('Chunk failed')));

    expect(screen).toHavePathname('/profile/1');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('could not load the layout "./profile/_layout.js"'),
      expect.any(Error)
    );
    warn.mockRestore();
  });

  it('shows the anchor error when a deep-linked layout has an invalid anchor', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const layout = lazyModule({
      unstable_settings: { anchor: 'missing' },
      default: () => <Stack />,
    });
    await renderRouter(profileRoutes(layout.load), {
      initialUrl: '/profile/1',
      wrapper: CatchError,
    });

    await act(async () => layout.resolve());

    expect(screen.getByTestId('error')).toHaveTextContent(
      /^The initial route name "missing" was not found in the layout at "\.\/profile\/_layout\.js"/
    );
    error.mockRestore();
  });

  it('keeps the group-named anchor of a layout that fails to load', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const layout = lazyModule(
      { unstable_settings: { anchor: 'b' }, default: () => <Stack /> },
      { native: true }
    );
    const result = await renderRouter(
      {
        '(a)/_layout': layout.load,
        '(a)/a': () => <Text testID="a" />,
        '(a)/b': () => <Text testID="b" />,
        '(a)/c': () => <Text testID="c" />,
      },
      { initialUrl: '/c' }
    );

    await act(async () => layout.reject(new Error('Chunk failed')));

    const groupState = result.getRouterState()!.routes[0]!.state!.routes[0]!.state!;
    expect(groupState.routes.map(({ name }) => name)).toEqual(['a', 'c']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('could not load the layout "./(a)/_layout.js"'),
      expect.any(Error)
    );
    warn.mockRestore();
  });

  it('uses the anchor once a layout missed by dispatchSync loads', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const layout = lazyModule(
      { unstable_settings: { anchor: 'other' }, default: () => <Stack /> },
      { native: true }
    );
    // Jest renders routes synchronously. In an app, `React.lazy` suspends until the chunk loads.
    Object.assign(layout.load, { default: () => <Stack /> });
    await renderRouter({
      index: () => <Text testID="index" />,
      'profile/_layout': layout.load,
      'profile/index': () => <Text testID="profile-index" />,
      'profile/other': () => <Text testID="profile-other" />,
    });
    const navigate = { type: 'NAVIGATE', payload: { name: 'profile' } };

    await act(() => navigationRef.current!.dispatchSync(navigate));
    await act(async () => layout.resolve());
    await act(() => navigationRef.current!.dispatchSync({ type: 'GO_BACK' }));
    await act(() => navigationRef.current!.dispatchSync(navigate));

    expect(screen.getByTestId('profile-other')).toBeVisible();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('keeps the order of navigations queued behind a waiting one', async () => {
    const layout = profileLayout();
    await renderRouter(profileRoutes(layout.load));

    await act(() => {
      router.push('/profile/1');
      router.push('/other');
    });

    expect(screen.getByTestId('index')).toBeVisible();

    await act(async () => layout.resolve());

    expect(screen.getByTestId('other')).toBeVisible();

    await act(() => router.back());

    expect(screen.getByTestId('profile-id')).toBeVisible();
  });

  it('applies dispatchSync while a navigation waits', async () => {
    const layout = profileLayout();
    await renderRouter(profileRoutes(layout.load));
    await act(() => router.push('/other'));

    await act(() => router.push('/profile/1'));
    await act(() => navigationRef.current!.dispatchSync({ type: 'GO_BACK' }));

    expect(screen.getByTestId('index')).toBeVisible();

    await act(async () => layout.resolve());

    expect(screen.getByTestId('profile-id')).toBeVisible();

    await act(() => router.back());

    expect(screen.getByTestId('index')).toBeVisible();
  });

  it('waits for each layout in an anchor chain', async () => {
    const outer = lazyModule({ unstable_settings: { anchor: 'inner' }, default: () => <Stack /> });
    const inner = lazyModule({ unstable_settings: { anchor: 'first' }, default: () => <Stack /> });
    await renderRouter({
      index: () => <Text testID="index" />,
      'outer/_layout': outer.load,
      'outer/inner/_layout': inner.load,
      'outer/inner/first': () => <Text testID="first" />,
      'outer/inner/second': () => <Text testID="second" />,
      'outer/other': () => <Text testID="other" />,
    });

    await act(() => router.push('/outer/other', { withAnchor: true }));
    await act(async () => outer.resolve());

    expect(screen.getByTestId('index')).toBeVisible();

    await act(async () => inner.resolve());

    expect(screen.getByTestId('other')).toBeVisible();

    await act(() => router.back());

    expect(screen.getByTestId('first')).toBeVisible();
  });
});
