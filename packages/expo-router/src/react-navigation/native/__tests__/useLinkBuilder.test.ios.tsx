import { render } from '@testing-library/react-native';

import { NavigationHelpersContext, NavigationRouteContext } from '../../core';
import type { NavigationHelpers, ParamListBase } from '../../core';
import { NavigationContainer } from '../../core/__tests__/__fixtures__/NavigationContainer';
import {
  createTestState,
  expectNoUnexpectedWarnings,
} from '../../core/__tests__/__fixtures__/renderTestState';
import { createStackNavigator } from '../__stubs__/createStackNavigator';
import { useLinkBuilder } from '../useLinkBuilder';

const initialState = createTestState(['Foo']);
const nestedInitialState = createTestState(['Foo'], { Foo: ['Bar'] });

const config = {
  prefixes: ['https://example.com'],
  config: {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Bar: 'bar/:id',
        },
      },
    },
  },
  getInitialURL() {
    return null;
  },
};

expectNoUnexpectedWarnings();

test('builds href outside of a navigator', () => {
  expect.assertions(2);

  const Root = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Foo');

    expect(href).toBe('/foo');

    return null;
  };

  render(
    <NavigationContainer initialState={initialState} linking={config}>
      <Root />
    </NavigationContainer>
  );
});

test('builds href in navigator layout', () => {
  expect.assertions(2);

  const Test = ({ children }: { children: React.ReactNode }) => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Foo');

    expect(href).toBe('/foo');

    return children;
  };

  const Stack = createStackNavigator<{ Foo: undefined }>();

  render(
    <NavigationContainer initialState={initialState} linking={config}>
      <Stack.Navigator layout={({ children }) => <Test>{children}</Test>}>
        <Stack.Screen name="Foo">{() => null}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
});

test('builds href in route context', () => {
  expect.assertions(2);

  const Test = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Foo');

    expect(href).toBe('/foo');

    return null;
  };

  const Stack = createStackNavigator<{ Foo: undefined }>();

  render(
    <NavigationContainer initialState={initialState} linking={config}>
      <Stack.Navigator
        layout={({ state }) => (
          <NavigationRouteContext.Provider value={state.routes.find((r) => r.name === 'Foo')}>
            <Test />
          </NavigationRouteContext.Provider>
        )}>
        <Stack.Screen name="Foo">{() => null}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
});

test('builds href in stack navigator screen without reading navigation state imperatively', () => {
  expect.assertions(2);

  const HrefProbe = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Foo');

    expect(href).toBe('/foo');

    return null;
  };

  const Test = ({ navigation }: { navigation: NavigationHelpers<ParamListBase> }) => (
    <NavigationHelpersContext.Provider
      value={{
        ...navigation,
        getState() {
          throw new Error('navigation.getState must not be read');
        },
      }}>
      <HrefProbe />
    </NavigationHelpersContext.Provider>
  );

  const StackA = createStackNavigator<{ Foo: undefined }>();

  render(
    <NavigationContainer initialState={initialState} linking={config}>
      <StackA.Navigator>
        <StackA.Screen name="Foo" component={Test} />
      </StackA.Navigator>
    </NavigationContainer>
  );
});

test('builds href in nested navigator layout', () => {
  expect.assertions(2);

  const Test = ({ children }: { children: React.ReactNode }) => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Bar', { id: '42' });

    expect(href).toBe('/foo/bar/42');

    return children;
  };

  const StackA = createStackNavigator<{ Foo: undefined }>();
  const StackB = createStackNavigator<{ Bar: { id: string } }>();

  render(
    <NavigationContainer initialState={nestedInitialState} linking={config}>
      <StackA.Navigator>
        <StackA.Screen name="Foo">
          {() => (
            <StackB.Navigator layout={({ children }) => <Test>{children}</Test>}>
              <StackB.Screen name="Bar">{() => null}</StackB.Screen>
            </StackB.Navigator>
          )}
        </StackA.Screen>
      </StackA.Navigator>
    </NavigationContainer>
  );
});

test('builds href in nested route context', () => {
  expect.assertions(2);

  const Test = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Bar', { id: '42' });

    expect(href).toBe('/foo/bar/42');

    return null;
  };

  const StackA = createStackNavigator<{ Foo: undefined }>();
  const StackB = createStackNavigator<{ Bar: { id: string } }>();

  render(
    <NavigationContainer initialState={nestedInitialState} linking={config}>
      <StackA.Navigator>
        <StackA.Screen name="Foo">
          {() => (
            <StackB.Navigator
              layout={({ state }) => (
                <NavigationRouteContext.Provider value={state.routes.find((r) => r.name === 'Bar')}>
                  <Test />
                </NavigationRouteContext.Provider>
              )}>
              <StackB.Screen name="Bar">{() => null}</StackB.Screen>
            </StackB.Navigator>
          )}
        </StackA.Screen>
      </StackA.Navigator>
    </NavigationContainer>
  );
});

test('builds href in nested navigator screen', () => {
  expect.assertions(2);

  const Test = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Bar', { id: '42' });

    expect(href).toBe('/foo/bar/42');

    return null;
  };

  const StackA = createStackNavigator<{ Foo: undefined }>();
  const StackB = createStackNavigator<{ Bar: { id: string } }>();

  render(
    <NavigationContainer initialState={nestedInitialState} linking={config}>
      <StackA.Navigator>
        <StackA.Screen name="Foo">
          {() => (
            <StackB.Navigator>
              <StackB.Screen name="Bar" component={Test} />
            </StackB.Navigator>
          )}
        </StackA.Screen>
      </StackA.Navigator>
    </NavigationContainer>
  );
});

test('builds action from href outside of a navigator', () => {
  expect.assertions(2);

  const Test = () => {
    const { buildAction } = useLinkBuilder();

    const action = buildAction('/foo');

    expect(action).toEqual({
      type: 'NAVIGATE',
      payload: { name: 'Foo', path: '/foo', pop: true },
    });

    return null;
  };

  render(
    <NavigationContainer initialState={initialState} linking={config}>
      <Test />
    </NavigationContainer>
  );
});

test('builds action from href in navigator screen', () => {
  expect.assertions(2);

  const Test = () => {
    const { buildAction } = useLinkBuilder();

    const action = buildAction('/foo');

    expect(action).toEqual({
      type: 'NAVIGATE',
      payload: { name: 'Foo', path: '/foo', pop: true },
    });

    return null;
  };

  const Stack = createStackNavigator<{ Foo: undefined }>();

  render(
    <NavigationContainer initialState={initialState} linking={config}>
      <Stack.Navigator>
        <Stack.Screen name="Foo" component={Test} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

test('builds action from href in nested navigator', () => {
  expect.assertions(2);

  const Test = () => {
    const { buildAction } = useLinkBuilder();

    const action = buildAction('/foo/bar/42');

    expect(action).toEqual({
      type: 'NAVIGATE',
      payload: {
        name: 'Foo',
        params: { id: '42' },
        pop: true,
        state: {
          __internal__routerActionState: true,
          routes: [{ name: 'Bar', path: '/foo/bar/42', params: { id: '42' } }],
        },
      },
    });

    return null;
  };

  const StackA = createStackNavigator<{ Foo: undefined }>();
  const StackB = createStackNavigator<{ Bar: { id: string } }>();

  render(
    <NavigationContainer initialState={nestedInitialState} linking={config}>
      <StackA.Navigator>
        <StackA.Screen name="Foo">
          {() => (
            <StackB.Navigator>
              <StackB.Screen name="Bar" component={Test} />
            </StackB.Navigator>
          )}
        </StackA.Screen>
      </StackA.Navigator>
    </NavigationContainer>
  );
});

test('builds a navigate action past a configured initial route', () => {
  expect.assertions(2);
  const linking = {
    ...config,
    config: { initialRouteName: 'Foo', screens: { Foo: 'details' } },
    getStateFromPath: () => ({
      index: 1,
      routes: [{ name: 'Foo' }, { name: 'Foo', path: '/details' }],
    }),
  };

  const Test = () => {
    const { buildAction } = useLinkBuilder();

    expect(buildAction('/details')).toEqual({
      type: 'NAVIGATE',
      payload: { name: 'Foo', path: '/details' },
    });
    return null;
  };

  render(
    <NavigationContainer
      initialState={initialState}
      // The non-generic test container types its route list as `object`, so it cannot express an initial route.
      linking={linking as unknown as React.ComponentProps<typeof NavigationContainer>['linking']}>
      <Test />
    </NavigationContainer>
  );
});

test('builds a marked reset action for state that cannot be represented as navigate', () => {
  expect.assertions(2);

  const parsedState = {
    index: 2,
    routes: [{ name: 'Home' }, { name: 'Details' }, { name: 'Other' }],
  };
  const Test = () => {
    const { buildAction } = useLinkBuilder();

    expect(buildAction('/other')).toEqual({
      type: 'RESET',
      payload: { ...parsedState, __internal__routerActionState: true },
    });
    return null;
  };

  render(
    <NavigationContainer
      initialState={initialState}
      linking={{ ...config, getStateFromPath: () => parsedState }}>
      <Test />
    </NavigationContainer>
  );
});
