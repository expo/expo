import { render } from '@testing-library/react-native';

import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { useNavigation } from '../useNavigation';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { MockRouter, MockRouterKey, mockInitialState } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('gets navigation prop from context', () => {
  expect.assertions(1);

  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const navigation = useNavigation();

    expect(navigation.navigate).toBeDefined();

    return null;
  };

  render(
    <BaseNavigationContainer initialState={mockInitialState({ routeNames: ['foo'] })}>
      <TestNavigator>
        <Screen name="foo" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );
});

test("gets navigation's parent from context", () => {
  expect.assertions(1);

  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const navigation = useNavigation();

    expect(navigation.getParent()).toBeDefined();

    return null;
  };

  render(
    <BaseNavigationContainer
      initialState={{
        stale: false,
        key: '0',
        index: 0,
        routeNames: ['foo'],
        routes: [
          {
            key: 'foo',
            name: 'foo',
            state: {
              stale: false,
              key: '1',
              index: 0,
              routeNames: ['bar'],
              routes: [{ key: 'bar', name: 'bar' }],
            },
          },
        ],
      }}>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="bar" component={Test} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );
});

test("gets navigation's parent's parent from context", () => {
  expect.assertions(2);

  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const navigation = useNavigation();
    const parent = navigation.getParent();

    expect(parent).toBeDefined();
    expect(parent?.navigate).toBeDefined();

    return null;
  };

  render(
    <BaseNavigationContainer
      initialState={{
        stale: false,
        key: '0',
        index: 0,
        routeNames: ['foo'],
        routes: [
          {
            key: 'foo',
            name: 'foo',
            state: {
              stale: false,
              key: '1',
              index: 0,
              routeNames: ['bar'],
              routes: [
                {
                  key: 'bar',
                  name: 'bar',
                  state: {
                    stale: false,
                    key: '2',
                    index: 0,
                    routeNames: ['quo'],
                    routes: [{ key: 'quo', name: 'quo' }],
                  },
                },
              ],
            },
          },
        ],
      }}>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="bar">
                {() => (
                  <TestNavigator>
                    <Screen name="quo" component={Test} />
                  </TestNavigator>
                )}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );
});

test('gets navigation from container from context', () => {
  expect.assertions(1);

  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const navigation = useNavigation();

    expect(navigation.navigate).toBeDefined();

    return null;
  };

  render(
    <BaseNavigationContainer initialState={mockInitialState({ routeNames: ['foo'] })}>
      <Test />
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );
});

test('throws if called outside a navigation context', () => {
  expect.assertions(1);

  const Test = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useNavigation()).toThrow(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );

    return null;
  };

  render(<Test />);
});
