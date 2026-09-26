import { act, render, renderHook } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import type { DefaultRouterOptions, NavigationState, Router } from '../../routers';
import { Group } from '../Group';
import { Screen } from '../Screen';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { type MockActions, MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

jest.useFakeTimers();

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('describes absent routes on demand', async () => {
  const barOptions = jest.fn(() => ({ title: 'Bar' }));
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <BaseNavigationContainer>{children}</BaseNavigationContainer>
  );
  const { result } = await renderHook(
    () =>
      useNavigationBuilder(MockRouter, {
        children: [
          <Screen key="foo" name="foo" component={React.Fragment} options={{ title: 'Foo' }} />,
          <Screen key="bar" name="bar" component={React.Fragment} options={barOptions} />,
        ],
      }),
    { wrapper }
  );

  const foo = result.current.state.routes[0]!;

  expect(result.current.descriptors[foo.key]).toMatchObject({
    route: foo,
    options: { title: 'Foo' },
  });
  expect(result.current.descriptors[foo.key]!.render()).not.toBeNull();
  expect(result.current.descriptors.bar).toBeUndefined();
  expect(barOptions).not.toHaveBeenCalled();

  const descriptor = result.current.describe({ key: undefined, name: 'bar' });
  expect(descriptor).toMatchObject({
    route: { key: undefined, name: 'bar' },
    options: { title: 'Bar' },
  });
  expect(descriptor.render()).toBeNull();
  expect(descriptor.navigation).toBeDefined();
  expect(barOptions).toHaveBeenCalledTimes(1);
});

test('sets options with options prop as an object', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index]!.key]!;

    return (
      <NavigationContent>
        <main>
          <Text>{options.title}</Text>
          <div>{render()}</div>
        </main>
      </NavigationContent>
    );
  };

  const TestScreen = (): any => <Text>Test screen</Text>;

  const root = await render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} options={{ title: 'Hello world' }} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <main>
      <Text>
        Hello world
      </Text>
      <div>
        <Text>
          Test screen
        </Text>
      </div>
    </main>
  `);
});

test('sets options with options prop as a fuction', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index]!.key]!;

    return (
      <NavigationContent>
        <main>
          <Text>{options.title}</Text>
          <div>{render()}</div>
        </main>
      </NavigationContent>
    );
  };

  const TestScreen = (): any => <Text>Test screen</Text>;

  const root = await render(
    <BaseNavigationContainer
      initialState={{ routes: [{ name: 'foo', params: { author: 'Jane' } }] }}>
      <TestNavigator>
        <Screen
          name="foo"
          component={TestScreen}
          options={({ route }: any) => ({ title: route.params.author })}
        />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <main>
      <Text>
        Jane
      </Text>
      <div>
        <Text>
          Test screen
        </Text>
      </div>
    </main>
  `);
});

test('sets options with screenOptions prop as an object', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => {
          const { render, options } = descriptors[route.key]!;

          return (
            <main key={route.key}>
              <Text>{options.title}</Text>
              <div>{render()}</div>
            </main>
          );
        })}
      </NavigationContent>
    );
  };

  const TestScreenA = (): any => <Text>Test screen A</Text>;

  const TestScreenB = (): any => <Text>Test screen B</Text>;

  const root = await render(
    <BaseNavigationContainer initialState={{ routes: [{ name: 'foo' }, { name: 'bar' }] }}>
      <TestNavigator screenOptions={{ title: 'Hello world' }}>
        <Screen name="foo" component={TestScreenA} />
        <Screen name="bar" component={TestScreenB} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <>
      <main>
        <Text>
          Hello world
        </Text>
        <div>
          <Text>
            Test screen A
          </Text>
        </div>
      </main>
      <main>
        <Text>
          Hello world
        </Text>
        <div>
          <Text>
            Test screen B
          </Text>
        </div>
      </main>
    </>
  `);
});

test('sets options with screenOptions prop as a fuction', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => {
          const { render, options } = descriptors[route.key]!;

          return (
            <main key={route.key}>
              <Text>{options.title}</Text>
              <div>{render()}</div>
            </main>
          );
        })}
      </NavigationContent>
    );
  };

  const TestScreenA = (): any => <Text>Test screen A</Text>;

  const TestScreenB = (): any => <Text>Test screen B</Text>;

  const root = await render(
    <BaseNavigationContainer
      initialState={{
        routes: [
          { name: 'foo', params: { author: 'Jane' } },
          { name: 'bar', params: { fruit: 'Apple' } },
        ],
      }}>
      <TestNavigator
        screenOptions={({ route }: any) => ({
          title: `${route.name}: ${route.params.author || route.params.fruit}`,
        })}>
        <Screen name="foo" component={TestScreenA} />
        <Screen name="bar" component={TestScreenB} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <>
      <main>
        <Text>
          foo: Jane
        </Text>
        <div>
          <Text>
            Test screen A
          </Text>
        </div>
      </main>
      <main>
        <Text>
          bar: Apple
        </Text>
        <div>
          <Text>
            Test screen B
          </Text>
        </div>
      </main>
    </>
  `);
});

test('sets initial options with setOptions', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      {
        title?: string;
        color?: string;
      },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index]!.key]!;

    return (
      <NavigationContent>
        <main>
          <Text style={{ color: options.color }}>{options.title}</Text>
          <div>{render()}</div>
        </main>
      </NavigationContent>
    );
  };

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      navigation.setOptions({
        title: 'Hello world',
      });
    });

    return <Text>Test screen</Text>;
  };

  const root = await render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" options={{ color: 'blue' }}>
          {(props) => <TestScreen {...props} />}
        </Screen>
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    <main>
      <Text
        style={
          {
            "color": "blue",
          }
        }
      >
        Hello world
      </Text>
      <div>
        <Text>
          Test screen
        </Text>
      </div>
    </main>
  `);
});

test('updates options with setOptions', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any,
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index]!.key]!;

    return (
      <NavigationContent>
        <main>
          <Text style={{ color: options.color }}>{options.title}</Text>
          <Text>{options.description}</Text>
          <Text>{options.author}</Text>
          <div>{render()}</div>
        </main>
      </NavigationContent>
    );
  };

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      navigation.setOptions({
        title: 'Hello world',
        description: 'Something here',
      });

      const timer = setTimeout(() =>
        navigation.setOptions({
          title: 'Hello again',
          author: 'Jane',
        })
      );

      return () => clearTimeout(timer);
    });

    return <Text>Test screen</Text>;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" options={{ color: 'blue' }}>
          {(props) => <TestScreen {...props} />}
        </Screen>
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const root = await render(element);

  await act(() => jest.runAllTimers());

  await root.rerender(element);

  expect(root).toMatchInlineSnapshot(`
    <main>
      <Text
        style={
          {
            "color": "blue",
          }
        }
      >
        Hello again
      </Text>
      <Text>
        Something here
      </Text>
      <Text>
        Jane
      </Text>
      <div>
        <Text>
          Test screen
        </Text>
      </div>
    </main>
  `);
});

test('renders layout defined for the screen', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any,
      any
    >(MockRouter, props);
    const { render } = descriptors[state.routes[state.index]!.key]!;

    return <NavigationContent>{render()}</NavigationContent>;
  };

  const TestScreen = () => {
    return <Text>Test screen</Text>;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator screenLayout={({ children }: any) => <main>{children}</main>}>
        <Group screenLayout={({ children }) => <section>{children}</section>}>
          <Screen
            name="foo"
            component={TestScreen}
            layout={({ children }) => <div>{children}</div>}
          />
          <Screen name="bar" component={React.Fragment} />
        </Group>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const root = await render(element);

  expect(root).toMatchInlineSnapshot(`
    <div>
      <Text>
        Test screen
      </Text>
    </div>
  `);
});

test('renders layout defined for the group', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any,
      any
    >(MockRouter, props);
    const { render } = descriptors[state.routes[state.index]!.key]!;

    return <NavigationContent>{render()}</NavigationContent>;
  };

  const TestScreen = () => {
    return <Text>Test screen</Text>;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator screenLayout={({ children }: any) => <main>{children}</main>}>
        <Group screenLayout={({ children }) => <section>{children}</section>}>
          <Screen name="foo" component={TestScreen} />
          <Screen name="bar" component={React.Fragment} />
        </Group>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const root = await render(element);

  expect(root).toMatchInlineSnapshot(`
    <section>
      <Text>
        Test screen
      </Text>
    </section>
  `);
});

test('renders layout defined for the navigator', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any,
      any
    >(MockRouter, props);
    const { render } = descriptors[state.routes[state.index]!.key]!;

    return <NavigationContent>{render()}</NavigationContent>;
  };

  const TestScreen = () => {
    return <Text>Test screen</Text>;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator screenLayout={({ children }: any) => <main>{children}</main>}>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const root = await render(element);

  expect(root).toMatchInlineSnapshot(`
    <main>
      <Text>
        Test screen
      </Text>
    </main>
  `);
});

test("returns correct value for canGoBack when it's not overridden", async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index]!.key]!;

    return (
      <NavigationContent>
        <main>
          <Text>{options.title}</Text>
          <div>{render()}</div>
        </main>
      </NavigationContent>
    );
  };

  let result = true;

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      result = navigation.canGoBack();
    });

    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} options={{ title: 'Hello world' }} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  await (await render(root)).rerender(root);

  expect(result).toBe(false);
});

test(`returns false for canGoBack when current router doesn't handle GO_BACK`, async () => {
  function TestRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<NavigationState, MockActions> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'GO_BACK') {
          return null;
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any,
      any
    >(TestRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  let result = false;

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      result = navigation.canGoBack();
    });

    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="baz" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  await (await render(root)).rerender(root);

  expect(result).toBe(false);
});

test('returns true for canGoBack when current router handles GO_BACK', async () => {
  function ParentRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<NavigationState, MockActions> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'GO_BACK') {
          return { state, affectedRouteKey: state.routes[state.index]?.key };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const ParentNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(ParentRouter, props);
    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const ChildNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  let result = false;

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      result = navigation.canGoBack();
    });

    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <ParentNavigator>
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux" component={TestScreen} />
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  await (await render(root)).rerender(root);

  expect(result).toBe(true);
});

test('returns true for canGoBack when parent router handles GO_BACK', async () => {
  function OverrodeRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<NavigationState, MockActions> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'GO_BACK') {
          return { state, affectedRouteKey: state.routes[state.index]?.key };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const OverrodeNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(OverrodeRouter, props);
    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  let result = true;

  const TestScreen = ({ navigation }: any): any => {
    React.useEffect(() => {
      result = navigation.canGoBack();
    });

    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="bar" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="baz">
          {() => (
            <OverrodeNavigator>
              <Screen name="qux">{() => null}</Screen>
            </OverrodeNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  await (await render(root)).rerender(root);

  expect(result).toBe(false);
});
