import { act, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { Link, useLocalSearchParams, useNavigation } from '../exports';
import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { renderRouter, screen } from '../testing-library';

describe('predefinedValues - basic navigation', () => {
  it('creates screens for predefined values', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text>index</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    // We need to perform a navigation to get latest state in rootState
    // Otherwise it used initial screen created from linking configuration
    // not including routeNames
    act(() => {
      router.push('/');
    });

    // Check that the screens are registered
    const rootState = store.state?.routes[0]?.state;
    expect(rootState?.routeNames).toContain('[param]');
    expect(rootState?.routeNames).toContain('a');
    expect(rootState?.routeNames).toContain('b');
  });

  it('navigates to predefined value screen using router.push', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    expect(screen.getByTestId('index')).toBeOnTheScreen();

    act(() => {
      router.push('/a');
    });

    expect(screen.getByTestId('param')).toHaveTextContent('a');
    expect(screen).toHavePathname('/a');

    // Check that we navigated to the 'a' screen, not '[param]'
    const rootState = store.state?.routes[0]?.state;
    const currentRoute = rootState?.routes[rootState.index];
    expect(currentRoute?.name).toBe('a');
  });

  it('navigates to non-predefined value using dynamic route', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    act(() => {
      router.push('/x');
    });

    expect(screen.getByTestId('param')).toHaveTextContent('x');
    expect(screen).toHavePathname('/x');

    // Check that we navigated to the '[param]' screen for non-predefined value
    const rootState = store.state?.routes[0]?.state;
    const currentRoute = rootState?.routes[rootState.index];
    expect(currentRoute?.name).toBe('[param]');
  });
});

describe('predefinedValues - router.replace', () => {
  it('can replace to predefined value screen', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    act(() => {
      router.push('/x');
    });

    expect(screen.getByTestId('param')).toHaveTextContent('x');

    act(() => {
      router.replace('/a');
    });

    expect(screen.getByTestId('param')).toHaveTextContent('a');
    expect(screen).toHavePathname('/a');

    // Check that we replaced to the 'a' screen
    const rootState = store.state?.routes[0]?.state;
    const currentRoute = rootState?.routes[rootState.index];
    expect(currentRoute?.name).toBe('a');

    // Should have only 2 routes: index and 'a' (replaced '[param]')
    expect(rootState?.routes.length).toBe(2);
  });
});

describe('predefinedValues - router.prefetch', () => {
  it('prefetches predefined value screen', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    act(() => {
      router.prefetch('/a');
    });

    // Check that the screen was preloaded with correct name
    const rootState = store.state?.routes[0]?.state;
    expect(rootState?.preloadedRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'a',
          params: expect.objectContaining({ param: 'a' }),
        }),
      ])
    );
  });

  it('prefetches non-predefined value using dynamic route', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    act(() => {
      router.prefetch('/x');
    });

    // Check that the screen was preloaded with dynamic route name
    const rootState = store.state?.routes[0]?.state;
    expect(rootState?.preloadedRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '[param]',
          params: expect.objectContaining({ param: 'x' }),
        }),
      ])
    );
  });
});

describe('predefinedValues - Link component', () => {
  it('navigates using Link to predefined value', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => (
        <Link href="/a" testID="link-a">
          Go to A
        </Link>
      ),
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    fireEvent.press(screen.getByTestId('link-a'));

    expect(screen.getByTestId('param')).toHaveTextContent('a');
    expect(screen).toHavePathname('/a');

    const rootState = store.state?.routes[0]?.state;
    const currentRoute = rootState?.routes[rootState.index];
    expect(currentRoute?.name).toBe('a');
  });

  it('navigates using Link with replace to predefined value', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => (
        <Link href="/x" testID="link-x">
          Go to X
        </Link>
      ),
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return (
          <>
            <Text testID="param">{param}</Text>
            <Link href="/a" replace testID="link-a-replace">
              Replace to A
            </Link>
          </>
        );
      },
    });

    fireEvent.press(screen.getByTestId('link-x'));
    expect(screen.getByTestId('param')).toHaveTextContent('x');

    fireEvent.press(screen.getByTestId('link-a-replace'));
    expect(screen.getByTestId('param')).toHaveTextContent('a');
    expect(screen).toHavePathname('/a');

    const rootState = store.state?.routes[0]?.state;
    const currentRoute = rootState?.routes[rootState.index];
    expect(currentRoute?.name).toBe('a');

    // Should have 2 routes: index and 'a' (replaced '[param]')
    expect(rootState?.routes.length).toBe(2);
  });

  it('prefetches using Link with prefetch prop', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => (
        <Link href="/a" prefetch testID="link-a">
          Go to A
        </Link>
      ),
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    // Give time for prefetch to happen
    act(() => {});

    const rootState = store.state?.routes[0]?.state;
    expect(rootState?.preloadedRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'a',
        }),
      ])
    );
  });
});

describe('predefinedValues - with other static screens', () => {
  it('works alongside static routes', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="static" />
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      static: () => <Text testID="static">static</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    // We need to perform a navigation to get latest state in rootState
    // Otherwise it used initial screen created from linking configuration
    // not including routeNames
    act(() => router.push('/'));

    const rootState = store.state?.routes[0]?.state;
    expect(rootState?.routeNames).toContain('index');
    expect(rootState?.routeNames).toContain('static');
    expect(rootState?.routeNames).toContain('[param]');
    expect(rootState?.routeNames).toContain('a');
    expect(rootState?.routeNames).toContain('b');

    // Navigate to static route
    act(() => {
      router.push('/static');
    });
    expect(screen.getByTestId('static')).toBeOnTheScreen();

    // Navigate to predefined value
    act(() => {
      router.push('/a');
    });
    expect(screen.getByTestId('param')).toHaveTextContent('a');

    // Navigate to non-predefined dynamic value
    act(() => {
      router.push('/x');
    });
    expect(screen.getByTestId('param')).toHaveTextContent('x');
  });

  it('when predefinedValues overlap with static route and route is not specified in <Stack.Screen>, throws error', () => {
    expect(() =>
      renderRouter({
        _layout: {
          default: () => (
            <Stack>
              <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
            </Stack>
          ),
        },
        index: () => <Text testID="index">index</Text>,
        a: () => <Text testID="static-a">static a</Text>,
        '[param]': function Param() {
          const { param } = useLocalSearchParams();
          return <Text testID="param">{param}</Text>;
        },
      })
    ).toThrow(
      "A navigator cannot contain multiple 'Screen' components with the same name (found duplicate screen named 'a')"
    );
  });

  it('when predefinedValues overlap with static route and route is specified in <Stack.Screen>, throws error', () => {
    expect(() =>
      renderRouter({
        _layout: {
          default: () => (
            <Stack>
              <Stack.Screen name="a" />
              <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
            </Stack>
          ),
        },
        index: () => <Text testID="index">index</Text>,
        a: () => <Text testID="static-a">static a</Text>,
        '[param]': function Param() {
          const { param } = useLocalSearchParams();
          return <Text testID="param">{param}</Text>;
        },
      })
    ).toThrow(
      "A navigator cannot contain multiple 'Screen' components with the same name (found duplicate screen named 'a')"
    );
  });
});

describe('predefinedValues - navigation history', () => {
  it('can go back from predefined value screen', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    act(() => {
      router.push('/a');
    });
    expect(screen.getByTestId('param')).toHaveTextContent('a');

    act(() => {
      router.back();
    });
    expect(screen.getByTestId('index')).toBeOnTheScreen();
  });

  it('navigates between different predefined values', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    act(() => {
      router.push('/a');
    });
    expect(screen.getByTestId('param')).toHaveTextContent('a');

    act(() => {
      router.push('/b');
    });
    expect(screen.getByTestId('param')).toHaveTextContent('b');

    const rootState = store.state?.routes[0]?.state;
    expect(rootState?.routes.length).toBe(3); // index, a, b
    expect(rootState?.routes[1]?.name).toBe('a');
    expect(rootState?.routes[2]?.name).toBe('b');
  });

  it('navigates from predefined value to dynamic value', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const { param } = useLocalSearchParams();
        return <Text testID="param">{param}</Text>;
      },
    });

    act(() => {
      router.push('/a');
    });
    expect(screen.getByTestId('param')).toHaveTextContent('a');

    act(() => {
      router.push('/x');
    });
    expect(screen.getByTestId('param')).toHaveTextContent('x');

    const rootState = store.state?.routes[0]?.state;
    expect(rootState?.routes.length).toBe(3); // index, a, x
    expect(rootState?.routes[1]?.name).toBe('a');
    expect(rootState?.routes[2]?.name).toBe('[param]');
  });
});

describe('predefinedValues - nested Stack', () => {
  it('works with nested stack navigators', () => {
    renderRouter({
      _layout: {
        default: () => <Stack />,
      },
      index: () => <Text testID="index">index</Text>,
      'nested/_layout': {
        default: () => (
          <Stack>
            <Stack.Screen name="[id]" unstable_predefinedValues={['one', 'two']} />
          </Stack>
        ),
      },
      'nested/index': () => <Text testID="nested-index">nested index</Text>,
      'nested/[id]': function NestedParam() {
        const { id } = useLocalSearchParams();
        return <Text testID="nested-param">{id}</Text>;
      },
    });

    act(() => {
      router.push('/nested');
    });
    expect(screen.getByTestId('nested-index')).toBeOnTheScreen();

    act(() => {
      router.push('/nested/one');
    });
    expect(screen.getByTestId('nested-param')).toHaveTextContent('one');

    // Check that we're on the 'one' screen, not '[id]'
    const rootState = store.state?.routes[0]?.state;
    const nestedState = rootState?.routes[rootState.index]?.state;
    const currentRoute = nestedState?.routes[nestedState.index];
    expect(currentRoute?.name).toBe('one');
  });

  it('can prefetch in nested stack with predefined values', () => {
    renderRouter({
      _layout: {
        default: () => <Stack />,
      },
      index: () => <Text testID="index">index</Text>,
      'nested/_layout': {
        default: () => (
          <Stack>
            <Stack.Screen name="[id]" unstable_predefinedValues={['one', 'two']} />
          </Stack>
        ),
      },
      'nested/index': () => <Text testID="nested-index">nested index</Text>,
      'nested/[id]': function NestedParam() {
        const { id } = useLocalSearchParams();
        return <Text testID="nested-param">{id}</Text>;
      },
    });

    act(() => {
      router.push('/nested');
    });

    act(() => {
      router.prefetch('/nested/two');
    });

    // Navigate to the prefetched route
    act(() => {
      router.push('/nested/two');
    });

    expect(screen.getByTestId('nested-param')).toHaveTextContent('two');

    const rootState = store.state?.routes[0]?.state;
    const nestedState = rootState?.routes[rootState.index]?.state;
    const currentRoute = nestedState?.routes[nestedState.index];
    expect(currentRoute?.name).toBe('two');
  });

  it('navigates between nested predefined values and parent routes', () => {
    renderRouter({
      _layout: {
        default: () => <Stack />,
      },
      index: () => <Text testID="index">index</Text>,
      other: () => <Text testID="other">other</Text>,
      'nested/_layout': {
        default: () => (
          <Stack>
            <Stack.Screen name="[id]" unstable_predefinedValues={['one', 'two']} />
          </Stack>
        ),
      },
      'nested/index': () => <Text testID="nested-index">nested index</Text>,
      'nested/[id]': function NestedParam() {
        const { id } = useLocalSearchParams();
        return <Text testID="nested-param">{id}</Text>;
      },
    });

    act(() => {
      router.push('/nested/one');
    });
    expect(screen.getByTestId('nested-param')).toHaveTextContent('one');

    act(() => {
      router.push('/other');
    });
    expect(screen.getByTestId('other')).toBeOnTheScreen();

    act(() => {
      router.push('/nested/two');
    });
    expect(screen.getByTestId('nested-param')).toHaveTextContent('two');
  });
});

describe('predefinedValues - multiple dynamic params', () => {
  it('works with multiple unstable_predefinedValues arrays', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[category]" unstable_predefinedValues={['electronics', 'books']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[category]/_layout': {
        default: () => (
          <Stack>
            <Stack.Screen name="[product]" unstable_predefinedValues={['featured', 'sale']} />
          </Stack>
        ),
      },
      '[category]/index': function Category() {
        const { category } = useLocalSearchParams();
        return <Text testID="category">{category}</Text>;
      },
      '[category]/[product]': function Product() {
        const { category, product } = useLocalSearchParams();
        return <Text testID="product">{`${category}/${product}`}</Text>;
      },
    });

    act(() => {
      router.push('/electronics');
    });
    expect(screen.getByTestId('category')).toHaveTextContent('electronics');

    act(() => {
      router.push('/electronics/featured');
    });
    expect(screen.getByTestId('product')).toHaveTextContent('electronics/featured');
  });
});

describe('predefinedValues - params are passed correctly', () => {
  it('passes param in search params for predefined value', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const params = useLocalSearchParams();
        return <Text testID="params">{JSON.stringify(params)}</Text>;
      },
    });

    act(() => {
      router.push('/a');
    });

    expect(screen.getByTestId('params')).toHaveTextContent(JSON.stringify({ param: 'a' }));
  });

  it('preserves additional query params for predefined value', () => {
    renderRouter({
      _layout: {
        default: () => (
          <Stack>
            <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
          </Stack>
        ),
      },
      index: () => <Text testID="index">index</Text>,
      '[param]': function Param() {
        const params = useLocalSearchParams();
        return <Text testID="params">{JSON.stringify(params)}</Text>;
      },
    });

    act(() => {
      router.push('/a?extra=value');
    });

    const params = JSON.parse(screen.getByTestId('params').props.children);
    expect(params.param).toBe('a');
    expect(params.extra).toBe('value');
  });
});

describe('predefinedValues - initial URL', () => {
  it('can start with predefined value as initial URL', () => {
    renderRouter(
      {
        _layout: {
          default: () => (
            <Stack>
              <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
            </Stack>
          ),
        },
        index: () => <Text testID="index">index</Text>,
        '[param]': function Param() {
          const { param } = useLocalSearchParams();
          const navigation = useNavigation();
          return (
            <View>
              <Text testID="param">{param}</Text>;
              <Text testID="state">{JSON.stringify(navigation.getState())}</Text>;
            </View>
          );
        },
      },
      {
        initialUrl: '/a',
      }
    );

    expect(screen.getByTestId('param')).toHaveTextContent('a');
    expect(screen).toHavePathname('/a');
    expect(screen.getByTestId('state')).toBeDefined();
    const parsedState = JSON.parse(screen.getByTestId('state').props.children);
    expect(parsedState?.routeNames).toContain('a');
    expect(parsedState?.routes[0]?.name).toBe('a');
  });

  it('can start with predefined value as initial URL', () => {
    renderRouter(
      {
        _layout: {
          default: () => (
            <Stack>
              <Stack.Screen name="[param]" unstable_predefinedValues={['a', 'b']} />
            </Stack>
          ),
        },
        index: () => <Text testID="index">index</Text>,
        '[param]': function Param() {
          const { param } = useLocalSearchParams();
          const navigation = useNavigation();
          return (
            <View>
              <Text testID="param">{param}</Text>;
              <Text testID="state">{JSON.stringify(navigation.getState())}</Text>;
            </View>
          );
        },
      },
      {
        initialUrl: '/x',
      }
    );

    expect(screen.getByTestId('param')).toHaveTextContent('x');
    expect(screen).toHavePathname('/x');
    expect(screen.getByTestId('state')).toBeDefined();
    const parsedState = JSON.parse(screen.getByTestId('state').props.children);
    expect(parsedState?.routes[0]?.name).toBe('[param]');
  });
});
