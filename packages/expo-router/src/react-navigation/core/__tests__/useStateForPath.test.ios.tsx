import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

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

test('gets focused route state at root', async () => {
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
      <Text>
        {route.name}
        {JSON.stringify(state)}
      </Text>
    );
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  await render(
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
    <>
      <Text>
        bar
        {"routes":[{"key":"bar-0","name":"bar"}]}
      </Text>
      <Text>
        xux
        {"routes":[{"key":"xux-1","name":"xux"}]}
      </Text>
    </>
  `);

  await act(() => navigation.navigate('xux'));

  expect(screen).toMatchInlineSnapshot(`
    <>
      <Text>
        bar
        {"routes":[{"key":"bar-0","name":"bar"}]}
      </Text>
      <Text>
        xux
        {"routes":[{"key":"xux-1","name":"xux"}]}
      </Text>
    </>
  `);
});

test('gets focused route state in nested navigator', async () => {
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
      <Text>
        {route.name}
        {JSON.stringify(state)}
      </Text>
    );
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  await render(
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
    <>
      <Text>
        bar-a
        {"routes":[{"key":"bar-0","name":"bar","state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}
      </Text>
      <Text>
        bar-b
        {"routes":[{"key":"bar-0","name":"bar","state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}
      </Text>
      <Text>
        xux
        {"routes":[{"key":"xux-1","name":"xux"}]}
      </Text>
    </>
  `);

  await act(() => navigation.navigate('bar', { answer: 42 }));

  expect(screen).toMatchInlineSnapshot(`
    <>
      <Text>
        bar-a
        {"routes":[{"key":"bar-0","name":"bar","params":{"answer":42},"state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}
      </Text>
      <Text>
        bar-b
        {"routes":[{"key":"bar-0","name":"bar","params":{"answer":42},"state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}
      </Text>
      <Text>
        xux
        {"routes":[{"key":"xux-1","name":"xux"}]}
      </Text>
    </>
  `);

  await act(() => navigation.navigate('bar', { screen: 'bar-b' }));

  expect(screen).toMatchInlineSnapshot(`
    <>
      <Text>
        bar-a
        {"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}
      </Text>
      <Text>
        bar-b
        {"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}
      </Text>
      <Text>
        xux
        {"routes":[{"key":"xux-1","name":"xux"}]}
      </Text>
    </>
  `);

  await act(() => navigation.navigate('xux'));

  expect(screen).toMatchInlineSnapshot(`
    <>
      <Text>
        bar-a
        {"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}
      </Text>
      <Text>
        bar-b
        {"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}
      </Text>
      <Text>
        xux
        {"routes":[{"key":"xux-1","name":"xux"}]}
      </Text>
    </>
  `);

  await act(() => navigation.navigate('xux', { fruit: 'apple' }));

  expect(screen).toMatchInlineSnapshot(`
    <>
      <Text>
        bar-a
        {"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-a-3","name":"bar-a"}]}}]}
      </Text>
      <Text>
        bar-b
        {"routes":[{"key":"bar-0","name":"bar","params":{"answer":42,"screen":"bar-b"},"state":{"routes":[{"key":"bar-b-4","name":"bar-b"}]}}]}
      </Text>
      <Text>
        xux
        {"routes":[{"key":"xux-1","name":"xux","params":{"fruit":"apple"}}]}
      </Text>
    </>
  `);
});

test('gets path in each screen', async () => {
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

    return <Text>{`${route.name}: ${path}`}</Text>;
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  await render(
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
    <>
      <Text>
        bar: /mybar
      </Text>
      <Text>
        bar-a: /mybar/a
      </Text>
      <Text>
        bar-b: /mybar/b
      </Text>
      <Text>
        xux: /myxux
      </Text>
    </>
  `);

  await act(() => navigation.navigate('bar', { answer: 42 }));

  expect(screen).toMatchInlineSnapshot(`
    <>
      <Text>
        bar: /mybar/42
      </Text>
      <Text>
        bar-a: /mybar/42/a
      </Text>
      <Text>
        bar-b: /mybar/42/b
      </Text>
      <Text>
        xux: /myxux
      </Text>
    </>
  `);

  await act(() => navigation.navigate('bar', { screen: 'bar-b' }));

  expect(screen).toMatchInlineSnapshot(`
    <>
      <Text>
        bar: /mybar/42?screen=bar-b
      </Text>
      <Text>
        bar-a: /mybar/42/a
      </Text>
      <Text>
        bar-b: /mybar/42/b
      </Text>
      <Text>
        xux: /myxux
      </Text>
    </>
  `);

  await act(() => navigation.navigate('xux'));

  expect(screen).toMatchInlineSnapshot(`
    <>
      <Text>
        bar: /mybar/42?screen=bar-b
      </Text>
      <Text>
        bar-a: /mybar/42/a
      </Text>
      <Text>
        bar-b: /mybar/42/b
      </Text>
      <Text>
        xux: /myxux
      </Text>
    </>
  `);

  await act(() => navigation.navigate('xux', { fruit: 'apple' }));

  expect(screen).toMatchInlineSnapshot(`
    <>
      <Text>
        bar: /mybar/42?screen=bar-b
      </Text>
      <Text>
        bar-a: /mybar/42/a
      </Text>
      <Text>
        bar-b: /mybar/42/b
      </Text>
      <Text>
        xux: /myxux?fruit=apple
      </Text>
    </>
  `);
});
