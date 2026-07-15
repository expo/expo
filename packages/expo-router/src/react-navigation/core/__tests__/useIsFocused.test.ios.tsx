import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { useIsFocused } from '../useIsFocused';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('renders correct focus state', () => {
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

    return <>{isFocused ? 'focused' : 'unfocused'}</>;
  };

  const navigation = React.createRef<any>();

  const root = render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second" component={Test} />
        <Screen name="third">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`"unfocused"`);

  act(() => navigation.current.navigate('second'));

  expect(root).toMatchInlineSnapshot(`"focused"`);

  act(() => navigation.current.navigate('third'));

  expect(root).toMatchInlineSnapshot(`"unfocused"`);

  act(() => navigation.current.navigate('second'));

  expect(root).toMatchInlineSnapshot(`"focused"`);
});
