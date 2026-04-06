import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import type { DefaultRouterOptions, NavigationState, Router } from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Group } from '../Group';
import { Screen } from '../Screen';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { type MockActions, MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

jest.useFakeTimers();

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('sets options with options prop as an object', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <NavigationContent>
        <main>
          <h1>{options.title}</h1>
          <div>{render()}</div>
        </main>
      </NavigationContent>
    );
  };

  const TestScreen = (): any => 'Test screen';

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} options={{ title: 'Hello world' }} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
                    <main>
                      <h1>
                        Hello world
                      </h1>
                      <div>
                        Test screen
                      </div>
                    </main>
          `);
});

test('sets options with options prop as a fuction', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <NavigationContent>
        <main>
          <h1>{options.title}</h1>
          <div>{render()}</div>
        </main>
      </NavigationContent>
    );
  };

  const TestScreen = (): any => 'Test screen';

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen
          name="foo"
          component={TestScreen}
          options={({ route }: any) => ({ title: route.params.author })}
          initialParams={{ author: 'Jane' }}
        />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
                    <main>
                      <h1>
                        Jane
                      </h1>
                      <div>
                        Test screen
                      </div>
                    </main>
          `);
});

test('sets options with screenOptions prop as an object', () => {
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
          const { render, options } = descriptors[route.key];

          return (
            <main key={route.key}>
              <h1>{options.title}</h1>
              <div>{render()}</div>
            </main>
          );
        })}
      </NavigationContent>
    );
  };

  const TestScreenA = (): any => 'Test screen A';

  const TestScreenB = (): any => 'Test screen B';

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator screenOptions={{ title: 'Hello world' }}>
        <Screen name="foo" component={TestScreenA} />
        <Screen name="bar" component={TestScreenB} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    [
      <main>
        <h1>
          Hello world
        </h1>
        <div>
          Test screen A
        </div>
      </main>,
      <main>
        <h1>
          Hello world
        </h1>
        <div>
          Test screen B
        </div>
      </main>,
    ]
  `);
});

test('sets options with screenOptions prop as a fuction', () => {
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
          const { render, options } = descriptors[route.key];

          return (
            <main key={route.key}>
              <h1>{options.title}</h1>
              <div>{render()}</div>
            </main>
          );
        })}
      </NavigationContent>
    );
  };

  const TestScreenA = (): any => 'Test screen A';

  const TestScreenB = (): any => 'Test screen B';

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator
        screenOptions={({ route }: any) => ({
          title: `${route.name}: ${route.params.author || route.params.fruit}`,
        })}>
        <Screen name="foo" component={TestScreenA} initialParams={{ author: 'Jane' }} />
        <Screen name="bar" component={TestScreenB} initialParams={{ fruit: 'Apple' }} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
    [
      <main>
        <h1>
          foo: Jane
        </h1>
        <div>
          Test screen A
        </div>
      </main>,
      <main>
        <h1>
          bar: Apple
        </h1>
        <div>
          Test screen B
        </div>
      </main>,
    ]
  `);
});

test('sets initial options with setOptions', () => {
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
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <NavigationContent>
        <main>
          <h1 color={options.color}>{options.title}</h1>
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

    return 'Test screen';
  };

  const root = render(
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
                  <h1
                    color="blue"
                  >
                    Hello world
                  </h1>
                  <div>
                    Test screen
                  </div>
                </main>
        `);
});

test('updates options with setOptions', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any,
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <NavigationContent>
        <main>
          <h1 color={options.color}>{options.title}</h1>
          <p>{options.description}</p>
          <caption>{options.author}</caption>
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

    return 'Test screen';
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

  const root = render(element);

  act(() => jest.runAllTimers());

  root.update(element);

  expect(root).toMatchInlineSnapshot(`
            <main>
              <h1
                color="blue"
              >
                Hello again
              </h1>
              <p>
                Something here
              </p>
              <caption>
                Jane
              </caption>
              <div>
                Test screen
              </div>
            </main>
      `);
});

test('renders layout defined for the screen', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any,
      any
    >(MockRouter, props);
    const { render } = descriptors[state.routes[state.index].key];

    return <NavigationContent>{render()}</NavigationContent>;
  };

  const TestScreen = () => {
    return <>Test screen</>;
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

  const root = render(element);

  expect(root).toMatchInlineSnapshot(`
<div>
  Test screen
</div>
`);
});

test('renders layout defined for the group', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any,
      any
    >(MockRouter, props);
    const { render } = descriptors[state.routes[state.index].key];

    return <NavigationContent>{render()}</NavigationContent>;
  };

  const TestScreen = () => {
    return <>Test screen</>;
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

  const root = render(element);

  expect(root).toMatchInlineSnapshot(`
<section>
  Test screen
</section>
`);
});

test('renders layout defined for the navigator', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      any,
      any,
      any
    >(MockRouter, props);
    const { render } = descriptors[state.routes[state.index].key];

    return <NavigationContent>{render()}</NavigationContent>;
  };

  const TestScreen = () => {
    return <>Test screen</>;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator screenLayout={({ children }: any) => <main>{children}</main>}>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const root = render(element);

  expect(root).toMatchInlineSnapshot(`
<main>
  Test screen
</main>
`);
});

test("returns correct value for canGoBack when it's not overridden", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder<
      NavigationState,
      any,
      Record<string, never>,
      { title?: string },
      any
    >(MockRouter, props);
    const { render, options } = descriptors[state.routes[state.index].key];

    return (
      <NavigationContent>
        <main>
          <h1>{options.title}</h1>
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

  render(root).update(root);

  expect(result).toBe(false);
});

test(`returns false for canGoBack when current router doesn't handle GO_BACK`, () => {
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
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
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

  render(root).update(root);

  expect(result).toBe(false);
});

test('returns true for canGoBack when current router handles GO_BACK', () => {
  function ParentRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<NavigationState, MockActions> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'GO_BACK') {
          return state;
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
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
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
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
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

  render(root).update(root);

  expect(result).toBe(true);
});

test('returns true for canGoBack when parent router handles GO_BACK', () => {
  function OverrodeRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<NavigationState, MockActions> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'GO_BACK') {
          return state;
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
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
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
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
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

  render(root).update(root);

  expect(result).toBe(false);
});
