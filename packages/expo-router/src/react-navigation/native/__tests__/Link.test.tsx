import { expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { createStackNavigator } from '../__stubs__/createStackNavigator';
import { Link } from '../Link';
import { NavigationContainer } from '../NavigationContainer';

type RootParamList = { Foo: undefined; Bar: { id: string } };

jest.replaceProperty(Platform, 'OS', 'web');

test('renders link with href on web', () => {
  const config = {
    prefixes: ['https://example.com'],
    config: {
      screens: {
        Foo: 'foo',
        Bar: 'bar/:id',
      },
    },
    getInitialURL() {
      return null;
    },
  };

  const Stack = createStackNavigator<RootParamList>();

  const FooScreen = () => {
    return (
      <Link<any> screen="Bar" params={{ id: '42' }}>
        Go to Bar
      </Link>
    );
  };

  const BarScreen = () => {
    return <Link<any> screen="Foo">Go to Foo</Link>;
  };

  const { getByText, toJSON } = render(
    <NavigationContainer linking={config}>
      <Stack.Navigator>
        <Stack.Screen name="Foo" component={FooScreen} />
        <Stack.Screen name="Bar" component={BarScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  expect(toJSON()).toMatchInlineSnapshot(`
<Text
  href="/bar/42"
  onPress={[Function]}
  role="link"
  style={
    [
      {
        "color": "rgb(0, 122, 255)",
      },
      {
        "fontFamily": "System",
        "fontWeight": "400",
      },
      undefined,
    ]
  }
>
  Go to Bar
</Text>
`);

  const event = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };

  fireEvent.press(getByText('Go to Bar'), event);

  expect(toJSON()).toMatchInlineSnapshot(`
<Text
  href="/foo"
  onPress={[Function]}
  role="link"
  style={
    [
      {
        "color": "rgb(0, 122, 255)",
      },
      {
        "fontFamily": "System",
        "fontWeight": "400",
      },
      undefined,
    ]
  }
>
  Go to Foo
</Text>
`);
});

test("doesn't navigate if default was prevented", () => {
  const config = {
    prefixes: ['https://example.com'],
    config: {
      screens: {
        Foo: 'foo',
        Bar: 'bar/:id',
      },
    },
    getInitialURL() {
      return null;
    },
  };

  const Stack = createStackNavigator<RootParamList>();

  const FooScreen = () => {
    return (
      <Link<any>
        screen="Bar"
        params={{ id: '42' }}
        onPress={(e) => e.preventDefault()}
      >
        Go to Bar
      </Link>
    );
  };

  const BarScreen = () => {
    return <Link<any> screen="Foo">Go to Foo</Link>;
  };

  const { getByText, toJSON } = render(
    <NavigationContainer linking={config}>
      <Stack.Navigator>
        <Stack.Screen name="Foo" component={FooScreen} />
        <Stack.Screen name="Bar" component={BarScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  expect(toJSON()).toMatchInlineSnapshot(`
<Text
  href="/bar/42"
  onPress={[Function]}
  role="link"
  style={
    [
      {
        "color": "rgb(0, 122, 255)",
      },
      {
        "fontFamily": "System",
        "fontWeight": "400",
      },
      undefined,
    ]
  }
>
  Go to Bar
</Text>
`);

  const event = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };

  fireEvent.press(getByText('Go to Bar'), event);

  expect(toJSON()).toMatchInlineSnapshot(`
<Text
  href="/bar/42"
  onPress={[Function]}
  role="link"
  style={
    [
      {
        "color": "rgb(0, 122, 255)",
      },
      {
        "fontFamily": "System",
        "fontWeight": "400",
      },
      undefined,
    ]
  }
>
  Go to Bar
</Text>
`);
});
