import { act, render, screen } from '@testing-library/react-native';

import { getPathFromState } from '../../../fork/getPathFromState';
import type { ParamListBase } from '../../routers';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { useRoute } from '../useRoute';
import { useStateForPath } from '../useStateForPath';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('gets focused route state at root', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = () => {
    const route = useRoute();
    const state = useStateForPath();

    return (
      <>
        {route.name}
        {JSON.stringify(state)}
      </>
    );
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer
      ref={navigation}
      initialState={{ routes: [{ name: 'bar' }, { name: 'xux' }] }}>
      <TestNavigator>
        <Screen name="bar" component={TestScreen} />
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(screen).toMatchInlineSnapshot(`
[
  "bar",
  "{"routes":[{"key":"bar-0","name":"bar"}]}",
  "xux",
  "{"routes":[{"key":"xux-1","name":"xux"}]}",
]
`);

  act(() => navigation.navigate('xux'));

  expect(screen).toMatchInlineSnapshot(`
[
  "bar",
  "{"routes":[{"key":"bar-0","name":"bar"}]}",
  "xux",
  "{"routes":[{"key":"xux-1","name":"xux"}]}",
]
`);
});

test('gets focused route state in nested navigator', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = () => {
    const route = useRoute();
    const state = useStateForPath();

    return (
      <>
        {route.name}
        {JSON.stringify(state)}
      </>
    );
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer
      ref={navigation}
      initialState={{
        routes: [
          {
            name: 'bar',
            state: { routes: [{ name: 'bar-a' }, { name: 'bar-b' }] },
          },
          { name: 'xux' },
        ],
      }}>
      <TestNavigator>
        <Screen name="bar">
          {() => (
            <TestNavigator>
              <Screen name="bar-a" component={TestScreen} />
              <Screen name="bar-b" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(screen).toMatchInlineSnapshot(`
[
  "bar-a",
  "{"routes":[{"key":"bar-0","name":"bar","state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}",
  "bar-b",
  "{"routes":[{"key":"bar-0","name":"bar","state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}",
  "xux",
  "{"routes":[{"key":"xux-1","name":"xux"}]}",
]
`);

  act(() => navigation.navigate('bar', { answer: 42 }));

  expect(screen).toMatchInlineSnapshot(`
[
  "bar-a",
  "{"routes":[{"key":"bar-0","name":"bar","params":{"answer":42},"state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}",
  "bar-b",
  "{"routes":[{"key":"bar-0","name":"bar","params":{"answer":42},"state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}",
  "xux",
  "{"routes":[{"key":"xux-1","name":"xux"}]}",
]
`);

  act(() => navigation.navigate('bar', { screen: 'bar-b' }));

  expect(screen).toMatchInlineSnapshot(`
[
  "bar-a",
  "{"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}",
  "bar-b",
  "{"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}",
  "xux",
  "{"routes":[{"key":"xux-1","name":"xux"}]}",
]
`);

  act(() => navigation.navigate('xux'));

  expect(screen).toMatchInlineSnapshot(`
[
  "bar-a",
  "{"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}",
  "bar-b",
  "{"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}",
  "xux",
  "{"routes":[{"key":"xux-1","name":"xux"}]}",
]
`);

  act(() => navigation.navigate('xux', { fruit: 'apple' }));

  expect(screen).toMatchInlineSnapshot(`
[
  "bar-a",
  "{"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}",
  "bar-b",
  "{"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}",
  "xux",
  "{"routes":[{"key":"xux-1","name":"xux","params":{"fruit":"apple"}}]}",
]
`);
});

test('gets path in each screen', () => {
  const usePath = () => {
    const state = useStateForPath();

    if (!state) {
      throw new Error('Could not find state for path');
    }

    return getPathFromState(state, {
      screens: {
        bar: {
          path: 'mybar/:answer?',
          screens: {
            'bar-a': 'a',
            'bar-b': 'b',
          },
        },
        xux: 'myxux',
      },
    });
  };

  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = () => {
    const route = useRoute();
    const path = usePath();

    return <>{`${route.name}: ${path}`}</>;
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer
      ref={navigation}
      initialState={{
        routes: [
          {
            name: 'bar',
            state: { routes: [{ name: 'bar-a' }, { name: 'bar-b' }] },
          },
          { name: 'xux' },
        ],
      }}>
      <TestNavigator>
        <Screen name="bar">
          {() => (
            <>
              <TestScreen />
              <TestNavigator>
                <Screen name="bar-a" component={TestScreen} />
                <Screen name="bar-b" component={TestScreen} />
              </TestNavigator>
            </>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(screen).toMatchInlineSnapshot(`
[
  "bar: /mybar",
  "bar-a: /mybar/a",
  "bar-b: /mybar/b",
  "xux: /myxux",
]
`);

  act(() => navigation.navigate('bar', { answer: 42 }));

  expect(screen).toMatchInlineSnapshot(`
[
  "bar: /mybar/42",
  "bar-a: /mybar/42/a",
  "bar-b: /mybar/42/b",
  "xux: /myxux",
]
`);

  act(() => navigation.navigate('bar', { screen: 'bar-b' }));

  expect(screen).toMatchInlineSnapshot(`
[
  "bar: /mybar/42?screen=bar-b",
  "bar-a: /mybar/42/a",
  "bar-b: /mybar/42/b",
  "xux: /myxux",
]
`);

  act(() => navigation.navigate('xux'));

  expect(screen).toMatchInlineSnapshot(`
[
  "bar: /mybar/42?screen=bar-b",
  "bar-a: /mybar/42/a",
  "bar-b: /mybar/42/b",
  "xux: /myxux",
]
`);

  act(() => navigation.navigate('xux', { fruit: 'apple' }));

  expect(screen).toMatchInlineSnapshot(`
[
  "bar: /mybar/42?screen=bar-b",
  "bar-a: /mybar/42/a",
  "bar-b: /mybar/42/b",
  "xux: /myxux?fruit=apple",
]
`);
});
