import { act, render, renderHook } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import type { ParamListBase } from '../../routers';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import {
  FocusedRouteKeyContext,
  IsFocusedContext,
  useIsFocused,
  useIsRouteFocused,
} from '../useIsFocused';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { useRoute } from '../useRoute';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('uses the focus context without a navigation object', async () => {
  const Test = () => {
    const isFocused = useIsFocused();

    return <Text>{isFocused ? 'focused' : 'unfocused'}</Text>;
  };

  const root = await render(
    <IsFocusedContext.Provider value>
      <Test />
    </IsFocusedContext.Provider>
  );

  expect(root).toMatchInlineSnapshot(`
    <Text>
      focused
    </Text>
  `);
});

test('throws without a focus context', async () => {
  const Test = () => {
    useIsFocused();
    return null;
  };

  await expect(async () => await render(<Test />)).rejects.toThrow(
    "Couldn't find a focus context. Make sure the component is rendered inside your app's route tree. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues."
  );
});

test.each([
  {
    routeKey: undefined,
    parentIsFocused: undefined,
    focusedRouteKey: 'route',
    expected: true,
  },
  {
    routeKey: undefined,
    parentIsFocused: false,
    focusedRouteKey: 'route',
    expected: false,
  },
  {
    routeKey: undefined,
    parentIsFocused: true,
    focusedRouteKey: 'route',
    expected: true,
  },
  {
    routeKey: 'route',
    parentIsFocused: undefined,
    focusedRouteKey: 'route',
    expected: true,
  },
  {
    routeKey: 'route',
    parentIsFocused: true,
    focusedRouteKey: 'other',
    expected: false,
  },
  {
    routeKey: 'route',
    parentIsFocused: false,
    focusedRouteKey: 'route',
    expected: false,
  },
])(
  'returns $expected for route $routeKey with parent focus $parentIsFocused and focused route $focusedRouteKey',
  async ({ routeKey, parentIsFocused, focusedRouteKey, expected }) => {
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <IsFocusedContext.Provider value={parentIsFocused}>
        <FocusedRouteKeyContext.Provider value={focusedRouteKey}>
          {children}
        </FocusedRouteKeyContext.Provider>
      </IsFocusedContext.Provider>
    );

    const { result } = await renderHook(() => useIsRouteFocused(routeKey), {
      wrapper,
    });

    expect(result.current).toBe(expected);
  }
);

test('renders correct focus state', async () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const isFocused = useIsFocused();

    return <Text>{isFocused ? 'focused' : 'unfocused'}</Text>;
  };

  const navigation = React.createRef<any>();

  const root = await render(
    <BaseNavigationContainer
      ref={navigation}
      initialState={{
        index: 0,
        routes: [{ name: 'first' }, { name: 'second' }, { name: 'third' }],
      }}>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second" component={Test} />
        <Screen name="third">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <Text>
      unfocused
    </Text>
  `);

  await act(() => navigation.current.navigate('second'));

  expect(root).toMatchInlineSnapshot(`
    <Text>
      focused
    </Text>
  `);

  await act(() => navigation.current.navigate('third'));

  expect(root).toMatchInlineSnapshot(`
    <Text>
      unfocused
    </Text>
  `);

  await act(() => navigation.current.navigate('second'));

  expect(root).toMatchInlineSnapshot(`
    <Text>
      focused
    </Text>
  `);
});

test('returns correct focus state after conditional rendering', async () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);
    const focusedRouteKey = state.routes[state.index]?.key;

    return (
      <NavigationContent>
        {focusedRouteKey ? descriptors[focusedRouteKey]?.render() : null}
      </NavigationContent>
    );
  };

  const TestScreen = () => {
    const route = useRoute();
    const isFocused = useIsFocused();

    // Ensure that there is no tearing
    expect(isFocused).toBe(true);

    return <Text>{`${route.name}, ${isFocused ? 'focused' : 'not-focused'}`}</Text>;
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  let update: (condition: boolean) => void;

  const Test = () => {
    const [condition, setCondition] = React.useState(false);

    update = setCondition;

    return (
      <BaseNavigationContainer ref={navigation}>
        <TestNavigator>
          {condition ? (
            <Screen name="bar" component={TestScreen} />
          ) : (
            <Screen name="foo" component={TestScreen} />
          )}
        </TestNavigator>
      </BaseNavigationContainer>
    );
  };

  const element = await render(<Test />);

  expect(element).toMatchInlineSnapshot(`
    <Text>
      foo, focused
    </Text>
  `);

  await act(() => update(true));

  expect(element).toMatchInlineSnapshot(`
    <Text>
      bar, focused
    </Text>
  `);
});
