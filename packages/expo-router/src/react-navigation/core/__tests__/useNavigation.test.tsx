import { beforeEach, expect, test } from '@jest/globals';
import { render } from '@testing-library/react-native';

import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { useNavigation } from '../useNavigation';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('gets navigation prop from context', () => {
  expect.assertions(1);

  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      MockRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const navigation = useNavigation();

    expect(navigation.navigate).toBeDefined();

    return null;
  };

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );
});

test("gets navigation's parent from context", () => {
  expect.assertions(1);

  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      MockRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const navigation = useNavigation();

    expect(navigation.getParent()).toBeDefined();

    return null;
  };

  render(
    <BaseNavigationContainer>
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
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      MockRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
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
    <BaseNavigationContainer>
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
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      MockRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const navigation = useNavigation();

    expect(navigation.navigate).toBeDefined();

    return null;
  };

  render(
    <BaseNavigationContainer>
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
