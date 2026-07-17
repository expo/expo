import { render } from '@testing-library/react-native';

import { NavigationContainer } from '../../../fork/NavigationContainer';
import { NavigationRouteContext } from '../../core';
import { createStackNavigator } from '../__stubs__/createStackNavigator';
import { useLinkBuilder } from '../useLinkBuilder';

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

test('builds href outside of a navigator', () => {
  expect.assertions(1);

  const Root = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Foo');

    expect(href).toBe('/foo');

    return null;
  };

  render(
    <NavigationContainer linking={config}>
      <Root />
    </NavigationContainer>
  );
});

test('builds href in navigator layout', () => {
  expect.assertions(1);

  const Test = ({ children }: { children: React.ReactNode }) => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Foo');

    expect(href).toBe('/foo');

    return children;
  };

  const Stack = createStackNavigator<{ Foo: undefined }>();

  render(
    <NavigationContainer
      linking={config}
      initialState={{
        stale: false,
        key: '@',
        index: 0,
        routeNames: ['Foo'],
        routes: [{ key: '@:Foo:0', name: 'Foo' }],
      }}>
      <Stack.Navigator layout={({ children }) => <Test>{children}</Test>}>
        <Stack.Screen name="Foo">{() => null}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
});

test('builds href in route context', () => {
  expect.assertions(1);

  const Test = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Foo');

    expect(href).toBe('/foo');

    return null;
  };

  const Stack = createStackNavigator<{ Foo: undefined }>();

  render(
    <NavigationContainer
      linking={config}
      initialState={{
        stale: false,
        key: '@',
        index: 0,
        routeNames: ['Foo'],
        routes: [{ key: '@:Foo:0', name: 'Foo' }],
      }}>
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
  expect.assertions(1);

  const Test = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Foo');

    expect(href).toBe('/foo');

    return null;
  };

  const StackA = createStackNavigator<{ Foo: undefined }>();

  render(
    <NavigationContainer
      linking={config}
      initialState={{
        stale: false,
        key: '@',
        index: 0,
        routeNames: ['Foo'],
        routes: [{ key: '@:Foo:0', name: 'Foo' }],
      }}>
      <StackA.Navigator>
        <StackA.Screen name="Foo" component={Test} />
      </StackA.Navigator>
    </NavigationContainer>
  );
});

test('builds href in nested navigator layout', () => {
  expect.assertions(1);

  const Test = ({ children }: { children: React.ReactNode }) => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Bar', { id: '42' });

    expect(href).toBe('/foo/bar/42');

    return children;
  };

  const StackA = createStackNavigator<{ Foo: undefined }>();
  const StackB = createStackNavigator<{ Bar: { id: string } }>();

  render(
    <NavigationContainer
      linking={config}
      initialState={{
        stale: false,
        key: '@',
        index: 0,
        routeNames: ['Foo'],
        routes: [
          {
            key: '@:Foo:0',
            name: 'Foo',
            state: {
              stale: false,
              key: '@:Foo:0',
              index: 0,
              routeNames: ['Bar'],
              routes: [{ key: '@:Foo:0:Bar:0', name: 'Bar', params: { id: '42' } }],
            },
          },
        ],
      }}>
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
  expect.assertions(1);

  const Test = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Bar', { id: '42' });

    expect(href).toBe('/foo/bar/42');

    return null;
  };

  const StackA = createStackNavigator<{ Foo: undefined }>();
  const StackB = createStackNavigator<{ Bar: { id: string } }>();

  render(
    <NavigationContainer
      linking={config}
      initialState={{
        stale: false,
        key: '@',
        index: 0,
        routeNames: ['Foo'],
        routes: [
          {
            key: '@:Foo:0',
            name: 'Foo',
            state: {
              stale: false,
              key: '@:Foo:0',
              index: 0,
              routeNames: ['Bar'],
              routes: [{ key: '@:Foo:0:Bar:0', name: 'Bar', params: { id: '42' } }],
            },
          },
        ],
      }}>
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
  expect.assertions(1);

  const Test = () => {
    const { buildHref } = useLinkBuilder();

    const href = buildHref('Bar', { id: '42' });

    expect(href).toBe('/foo/bar/42');

    return null;
  };

  const StackA = createStackNavigator<{ Foo: undefined }>();
  const StackB = createStackNavigator<{ Bar: { id: string } }>();

  render(
    <NavigationContainer
      linking={config}
      initialState={{
        stale: false,
        key: '@',
        index: 0,
        routeNames: ['Foo'],
        routes: [
          {
            key: '@:Foo:0',
            name: 'Foo',
            state: {
              stale: false,
              key: '@:Foo:0',
              index: 0,
              routeNames: ['Bar'],
              routes: [{ key: '@:Foo:0:Bar:0', name: 'Bar', params: { id: '42' } }],
            },
          },
        ],
      }}>
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
  expect.assertions(1);

  const Test = () => {
    const { buildAction } = useLinkBuilder();

    const action = buildAction('/foo');

    expect(action).toEqual({
      type: 'NAVIGATE',
      payload: {
        name: 'Foo',
        params: {},
        pop: true,
      },
    });

    return null;
  };

  render(
    <NavigationContainer linking={config}>
      <Test />
    </NavigationContainer>
  );
});

test('builds action from href in navigator screen', () => {
  expect.assertions(1);

  const Test = () => {
    const { buildAction } = useLinkBuilder();

    const action = buildAction('/foo');

    expect(action).toEqual({
      type: 'NAVIGATE',
      payload: {
        name: 'Foo',
        params: {},
        pop: true,
      },
    });

    return null;
  };

  const Stack = createStackNavigator<{ Foo: undefined }>();

  render(
    <NavigationContainer
      linking={config}
      initialState={{
        stale: false,
        key: '@',
        index: 0,
        routeNames: ['Foo'],
        routes: [{ key: '@:Foo:0', name: 'Foo' }],
      }}>
      <Stack.Navigator>
        <Stack.Screen name="Foo" component={Test} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

test('builds action from href in nested navigator', () => {
  expect.assertions(1);

  const Test = () => {
    const { buildAction } = useLinkBuilder();

    const action = buildAction('/foo/bar/42');

    expect(action).toEqual({
      type: 'NAVIGATE',
      payload: {
        name: 'Foo',
        params: {
          initial: true,
          screen: 'Bar',
          params: { id: '42' },
        },
        pop: true,
      },
    });

    return null;
  };

  const StackA = createStackNavigator<{ Foo: undefined }>();
  const StackB = createStackNavigator<{ Bar: { id: string } }>();

  render(
    <NavigationContainer
      linking={config}
      initialState={{
        stale: false,
        key: '@',
        index: 0,
        routeNames: ['Foo'],
        routes: [
          {
            key: '@:Foo:0',
            name: 'Foo',
            state: {
              stale: false,
              key: '@:Foo:0',
              index: 0,
              routeNames: ['Bar'],
              routes: [{ key: '@:Foo:0:Bar:0', name: 'Bar', params: { id: '42' } }],
            },
          },
        ],
      }}>
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
