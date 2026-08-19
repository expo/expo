import { render } from '@testing-library/react-native';

import { NavigationRouteContext, type NavigationState } from '../../core';
import { NavigationContainer } from '../../core/__tests__/__fixtures__/NavigationContainer';
import { createStackNavigator } from '../__stubs__/createStackNavigator';
import { useLinkBuilder } from '../useLinkBuilder';

const initialState = {
  stale: false,
  key: 'root',
  index: 0,
  routeNames: ['Foo'],
  routes: [{ key: 'Foo', name: 'Foo' }],
} satisfies NavigationState;

const nestedInitialState = {
  ...initialState,
  routes: [
    {
      key: 'Foo',
      name: 'Foo',
      state: {
        stale: false,
        key: 'nested',
        index: 0,
        routeNames: ['Bar'],
        routes: [{ key: 'Bar', name: 'Bar' }],
      },
    },
  ],
} satisfies NavigationState;

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

let warn: jest.SpiedFunction<typeof console.warn>;

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

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

test('builds href in stack navigator screen', () => {
  expect.assertions(2);

  const Test = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Foo');

    expect(href).toBe('/foo');

    return null;
  };

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
