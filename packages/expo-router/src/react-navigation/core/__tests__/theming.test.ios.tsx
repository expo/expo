import { render } from '@testing-library/react-native';
import * as React from 'react';

import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { useTheme } from '../theming/useTheme';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { MockRouter } from './__fixtures__/MockRouter';

test('can get current theme with useTheme', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const theme = useTheme();

    expect(theme).toEqual({
      colors: {
        primary: 'tomato',
      },
    });

    return null;
  };

  // Incomplete theme for testing
  const theme: any = {
    colors: {
      primary: 'tomato',
    },
  };

  render(
    <BaseNavigationContainer theme={theme}>
      <TestNavigator>
        <Screen name="foo" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );
});

test("throws if theme isn't passed to BaseNavigationContainer", () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useTheme()).toThrow("Couldn't find a theme");

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

test('throws if useTheme is used without BaseNavigationContainer', () => {
  const Test = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    expect(() => useTheme()).toThrow("Couldn't find a theme");

    return null;
  };

  render(<Test />);
});

test('passes theme to options prop', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    expect(descriptors[state.routes[0].key].options).toEqual({
      title: 'tomato',
    });

    return null;
  };

  // Incomplete theme for testing
  const theme: any = {
    colors: {
      primary: 'tomato',
    },
  };

  render(
    <BaseNavigationContainer theme={theme}>
      <TestNavigator>
        <Screen
          name="foo"
          component={React.Fragment}
          options={({ theme }: any) => ({ title: theme.colors.primary })}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );
});

test('passes theme to screenOptions prop', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors } = useNavigationBuilder(MockRouter, props);

    expect(descriptors[state.routes[0].key].options).toEqual({
      title: 'tomato',
    });

    expect(descriptors[state.routes[1].key].options).toEqual({
      title: 'tomato',
    });

    return null;
  };

  // Incomplete theme for testing
  const theme: any = {
    colors: {
      primary: 'tomato',
    },
  };

  render(
    <BaseNavigationContainer theme={theme}>
      <TestNavigator screenOptions={({ theme }: any) => ({ title: theme.colors.primary })}>
        <Screen name="foo" component={React.Fragment} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );
});
