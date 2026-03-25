import { beforeEach, expect, jest, test } from '@jest/globals';
import type { NavigationState, Router } from '../../routers';
import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('fires focus and blur events in root navigator', () => {
  const TestNavigator = React.forwardRef(function TestNavigator(
    props: any,
    ref: any
  ): any {
    const { state, navigation, descriptors, NavigationContent } =
      useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  });

  const firstFocusCallback = jest.fn();
  const firstBlurCallback = jest.fn();

  const secondFocusCallback = jest.fn();
  const secondBlurCallback = jest.fn();

  const thirdFocusCallback = jest.fn();
  const thirdBlurCallback = jest.fn();

  const fourthFocusCallback = jest.fn();
  const fourthBlurCallback = jest.fn();

  const createComponent =
    (focusCallback: any, blurCallback: any) =>
    ({ navigation }: any) => {
      React.useEffect(
        () => navigation.addListener('focus', focusCallback),
        [navigation]
      );

      React.useEffect(
        () => navigation.addListener('blur', blurCallback),
        [navigation]
      );

      return null;
    };

  const navigation = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={navigation}>
        <Screen
          name="first"
          component={createComponent(firstFocusCallback, firstBlurCallback)}
        />
        <Screen
          name="second"
          component={createComponent(secondFocusCallback, secondBlurCallback)}
        />
        <Screen
          name="third"
          component={createComponent(thirdFocusCallback, thirdBlurCallback)}
        />
        <Screen
          name="fourth"
          component={createComponent(fourthFocusCallback, fourthBlurCallback)}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstFocusCallback).toHaveBeenCalledTimes(1);
  expect(firstBlurCallback).toHaveBeenCalledTimes(0);
  expect(secondFocusCallback).toHaveBeenCalledTimes(0);
  expect(secondBlurCallback).toHaveBeenCalledTimes(0);
  expect(thirdFocusCallback).toHaveBeenCalledTimes(0);
  expect(thirdBlurCallback).toHaveBeenCalledTimes(0);
  expect(fourthFocusCallback).toHaveBeenCalledTimes(0);
  expect(fourthBlurCallback).toHaveBeenCalledTimes(0);

  act(() => navigation.current.navigate('second'));

  expect(firstBlurCallback).toHaveBeenCalledTimes(1);
  expect(secondFocusCallback).toHaveBeenCalledTimes(1);

  act(() => navigation.current.navigate('fourth'));

  expect(firstFocusCallback).toHaveBeenCalledTimes(1);
  expect(firstBlurCallback).toHaveBeenCalledTimes(1);
  expect(secondFocusCallback).toHaveBeenCalledTimes(1);
  expect(secondBlurCallback).toHaveBeenCalledTimes(1);
  expect(thirdFocusCallback).toHaveBeenCalledTimes(0);
  expect(thirdBlurCallback).toHaveBeenCalledTimes(0);
  expect(fourthFocusCallback).toHaveBeenCalledTimes(1);
  expect(fourthBlurCallback).toHaveBeenCalledTimes(0);
});

test('fires focus event after blur', () => {
  const TestNavigator = React.forwardRef(function TestNavigator(
    props: any,
    ref: any
  ): any {
    const { state, navigation, descriptors, NavigationContent } =
      useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  });

  const callback = jest.fn();

  const Test = ({ route, navigation }: any) => {
    React.useEffect(
      () =>
        navigation.addListener('focus', () => callback(route.name, 'focus')),
      [navigation, route.name]
    );

    React.useEffect(
      () => navigation.addListener('blur', () => callback(route.name, 'blur')),
      [navigation, route.name]
    );

    return null;
  };

  const navigation = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={navigation}>
        <Screen name="first" component={Test} />
        <Screen name="second" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(callback.mock.calls).toEqual([['first', 'focus']]);

  act(() => navigation.current.navigate('second'));

  expect(callback.mock.calls).toEqual([
    ['first', 'focus'],
    ['first', 'blur'],
    ['second', 'focus'],
  ]);

  act(() => navigation.current.navigate('first'));

  expect(callback.mock.calls).toEqual([
    ['first', 'focus'],
    ['first', 'blur'],
    ['second', 'focus'],
    ['second', 'blur'],
    ['first', 'focus'],
  ]);
});

test('fires focus and blur events in nested navigator', () => {
  const TestNavigator = React.forwardRef(function TestNavigator(
    props: any,
    ref: any
  ): any {
    const { state, navigation, descriptors, NavigationContent } =
      useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  });

  const firstFocusCallback = jest.fn();
  const firstBlurCallback = jest.fn();

  const secondFocusCallback = jest.fn();
  const secondBlurCallback = jest.fn();

  const thirdFocusCallback = jest.fn();
  const thirdBlurCallback = jest.fn();

  const fourthFocusCallback = jest.fn();
  const fourthBlurCallback = jest.fn();

  const createComponent =
    (focusCallback: any, blurCallback: any) =>
    ({ navigation }: any) => {
      React.useEffect(
        () => navigation.addListener('focus', focusCallback),
        [navigation]
      );

      React.useEffect(
        () => navigation.addListener('blur', blurCallback),
        [navigation]
      );

      return null;
    };

  const parent = React.createRef<any>();
  const child = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={parent}>
        <Screen
          name="first"
          component={createComponent(firstFocusCallback, firstBlurCallback)}
        />
        <Screen
          name="second"
          component={createComponent(secondFocusCallback, secondBlurCallback)}
        />
        <Screen name="nested">
          {() => (
            <TestNavigator ref={child}>
              <Screen
                name="third"
                component={createComponent(
                  thirdFocusCallback,
                  thirdBlurCallback
                )}
              />
              <Screen
                name="fourth"
                component={createComponent(
                  fourthFocusCallback,
                  fourthBlurCallback
                )}
              />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstFocusCallback).toHaveBeenCalledTimes(1);
  expect(secondFocusCallback).toHaveBeenCalledTimes(0);
  expect(thirdFocusCallback).toHaveBeenCalledTimes(0);
  expect(fourthFocusCallback).toHaveBeenCalledTimes(0);

  act(() => child.current.navigate('fourth'));

  expect(firstFocusCallback).toHaveBeenCalledTimes(1);

  // FIXME: figure out why this is called twice instead of once
  expect(fourthFocusCallback).toHaveBeenCalledTimes(2);
  expect(thirdFocusCallback).toHaveBeenCalledTimes(0);

  act(() => parent.current.navigate('second'));

  expect(thirdFocusCallback).toHaveBeenCalledTimes(0);
  expect(secondFocusCallback).toHaveBeenCalledTimes(1);
  expect(fourthBlurCallback).toHaveBeenCalledTimes(1);

  act(() => parent.current.navigate('nested'));

  expect(firstBlurCallback).toHaveBeenCalledTimes(1);
  expect(secondBlurCallback).toHaveBeenCalledTimes(1);
  expect(thirdFocusCallback).toHaveBeenCalledTimes(0);
  expect(fourthFocusCallback).toHaveBeenCalledTimes(3);

  act(() => parent.current.navigate('nested', { screen: 'third' }));

  expect(fourthBlurCallback).toHaveBeenCalledTimes(2);
  expect(thirdFocusCallback).toHaveBeenCalledTimes(1);

  act(() => parent.current.navigate('first'));

  expect(firstFocusCallback).toHaveBeenCalledTimes(2);
  expect(thirdBlurCallback).toHaveBeenCalledTimes(2);

  act(() => parent.current.navigate('nested', { screen: 'fourth' }));

  expect(fourthFocusCallback).toHaveBeenCalledTimes(4);
  expect(thirdBlurCallback).toHaveBeenCalledTimes(2);
  expect(firstBlurCallback).toHaveBeenCalledTimes(2);

  act(() => parent.current.navigate('nested', { screen: 'third' }));

  expect(thirdFocusCallback).toHaveBeenCalledTimes(2);
  expect(fourthBlurCallback).toHaveBeenCalledTimes(3);

  // Make sure nothing else has changed
  expect(firstFocusCallback).toHaveBeenCalledTimes(2);
  expect(firstBlurCallback).toHaveBeenCalledTimes(2);

  expect(secondFocusCallback).toHaveBeenCalledTimes(1);
  expect(secondBlurCallback).toHaveBeenCalledTimes(1);

  expect(thirdFocusCallback).toHaveBeenCalledTimes(2);
  expect(thirdBlurCallback).toHaveBeenCalledTimes(2);

  expect(fourthFocusCallback).toHaveBeenCalledTimes(4);
  expect(fourthBlurCallback).toHaveBeenCalledTimes(3);
});

test('fires blur event when a route is removed with a delay', async () => {
  const TestRouter = (options: any): Router<NavigationState, any> => {
    const router = MockRouter(options);

    return {
      ...router,

      getInitialState({ routeNames, routeParamList }) {
        const initialRouteName =
          options.initialRouteName !== undefined
            ? options.initialRouteName
            : routeNames[0];

        return {
          stale: false,
          type: 'test',
          key: 'stack',
          index: 0,
          routeNames,
          routes: [
            {
              key: initialRouteName,
              name: initialRouteName,
              params: routeParamList[initialRouteName],
            },
          ],
        };
      },

      getStateForAction(state, action, options) {
        switch (action.type) {
          case 'PUSH':
            return {
              ...state,
              index: state.index + 1,
              routes: [...state.routes, action.payload],
            };
          case 'POP': {
            const routes = state.routes.slice(0, -1);

            return {
              ...state,
              index: routes.length - 1,
              routes,
            };
          }
          default:
            return router.getStateForAction(state, action, options);
        }
      },

      actionCreators: {
        push(payload) {
          return { type: 'PUSH', payload };
        },

        pop() {
          return { type: 'POP' };
        },
      },
    };
  };

  const TestNavigator = React.forwardRef(function TestNavigator(
    props: any,
    ref: any
  ): any {
    const { state, navigation, descriptors, NavigationContent } =
      useNavigationBuilder(TestRouter, props);

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    const [previous, dispatch] = React.useReducer(
      (state: any, action: any) => {
        if (state.routes !== action.routes) {
          return { ...state, ...action };
        }

        return state;
      },
      { routes: state.routes, descriptors }
    );

    React.useEffect(() => {
      dispatch({ routes: state.routes, descriptors });
    }, [descriptors, state.routes]);

    return (
      <NavigationContent>
        {previous.routes.map((route: any) =>
          previous.descriptors[route.key].render()
        )}
      </NavigationContent>
    );
  });

  const blurCallback = jest.fn();

  const First = () => null;

  const Second = ({ navigation }: any) => {
    React.useEffect(
      () => navigation.addListener('blur', blurCallback),
      [navigation]
    );

    return null;
  };

  const navigation = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={navigation}>
        <Screen name="first" component={First} />
        <Screen name="second" component={Second} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() =>
    navigation.current.push({
      name: 'second',
      key: 'second',
    })
  );

  expect(blurCallback).toHaveBeenCalledTimes(0);

  act(() => navigation.current.pop());

  expect(blurCallback).toHaveBeenCalledTimes(1);
});

test('fires custom events added with addListener', () => {
  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef(function TestNavigator(
    props: any,
    ref: any
  ): any {
    const { state, navigation, descriptors, NavigationContent } =
      useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  });

  const firstCallback: any = jest.fn();
  const secondCallback: any = jest.fn();
  const thirdCallback: any = jest.fn();

  const createComponent =
    (callback: any) =>
    ({ navigation }: any) => {
      React.useEffect(
        () => navigation.addListener(eventName, callback),
        [navigation]
      );

      return null;
    };

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen name="first" component={createComponent(firstCallback)} />
        <Screen name="second" component={createComponent(secondCallback)} />
        <Screen name="third" component={createComponent(thirdCallback)} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstCallback).toHaveBeenCalledTimes(0);
  expect(secondCallback).toHaveBeenCalledTimes(0);
  expect(thirdCallback).toHaveBeenCalledTimes(0);

  const target =
    ref.current.state.routes[ref.current.state.routes.length - 1].key;

  act(() => {
    ref.current.navigation.emit({
      type: eventName,
      target,
      data: 42,
    });
  });

  expect(firstCallback).toHaveBeenCalledTimes(0);
  expect(secondCallback).toHaveBeenCalledTimes(0);
  expect(thirdCallback).toHaveBeenCalledTimes(1);
  expect(thirdCallback.mock.calls[0][0].type).toBe('someSuperCoolEvent');
  expect(thirdCallback.mock.calls[0][0].data).toBe(42);
  expect(thirdCallback.mock.calls[0][0].target).toBe(target);
  expect(thirdCallback.mock.calls[0][0].defaultPrevented).toBeUndefined();
  expect(thirdCallback.mock.calls[0][0].preventDefault).toBeUndefined();

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(firstCallback.mock.calls[0][0].target).toBeUndefined();
  expect(secondCallback.mock.calls[0][0].target).toBeUndefined();
  expect(thirdCallback.mock.calls[1][0].target).toBeUndefined();

  expect(firstCallback).toHaveBeenCalledTimes(1);
  expect(secondCallback).toHaveBeenCalledTimes(1);
  expect(thirdCallback).toHaveBeenCalledTimes(2);
});

test("doesn't call same listener multiple times with addListener", () => {
  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef(function TestNavigator(
    props: any,
    ref: any
  ): any {
    const { state, navigation, descriptors, NavigationContent } =
      useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  });

  const callback = jest.fn();

  const Test = ({ navigation }: any) => {
    React.useEffect(
      () => navigation.addListener(eventName, callback),
      [navigation]
    );

    return null;
  };

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen name="first" component={Test} />
        <Screen name="second" component={Test} />
        <Screen name="third" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(callback).toHaveBeenCalledTimes(0);

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(callback).toHaveBeenCalledTimes(1);
});

test('fires custom events added with listeners prop', () => {
  const eventName = 'someSuperCoolEvent';

  // eslint-disable-next-line @eslint-react/no-missing-component-display-name
  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation } = useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return null;
  });

  const firstCallback: any = jest.fn();
  const secondCallback: any = jest.fn();
  const thirdCallback: any = jest.fn();

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen
          name="first"
          listeners={{ someSuperCoolEvent: firstCallback }}
          component={React.Fragment}
        />
        <Screen
          name="second"
          listeners={{ someSuperCoolEvent: secondCallback }}
          component={React.Fragment}
        />
        <Screen
          name="third"
          listeners={{ someSuperCoolEvent: thirdCallback }}
          component={React.Fragment}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstCallback).toHaveBeenCalledTimes(0);
  expect(secondCallback).toHaveBeenCalledTimes(0);
  expect(thirdCallback).toHaveBeenCalledTimes(0);

  const target =
    ref.current.state.routes[ref.current.state.routes.length - 1].key;

  act(() => {
    ref.current.navigation.emit({
      type: eventName,
      target,
      data: 42,
    });
  });

  expect(firstCallback).toHaveBeenCalledTimes(0);
  expect(secondCallback).toHaveBeenCalledTimes(0);
  expect(thirdCallback).toHaveBeenCalledTimes(1);
  expect(thirdCallback.mock.calls[0][0].type).toBe('someSuperCoolEvent');
  expect(thirdCallback.mock.calls[0][0].data).toBe(42);
  expect(thirdCallback.mock.calls[0][0].target).toBe(target);
  expect(thirdCallback.mock.calls[0][0].defaultPrevented).toBeUndefined();
  expect(thirdCallback.mock.calls[0][0].preventDefault).toBeUndefined();

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(firstCallback.mock.calls[0][0].target).toBeUndefined();

  expect(firstCallback).toHaveBeenCalledTimes(1);
  expect(secondCallback).toHaveBeenCalledTimes(0);
  expect(thirdCallback).toHaveBeenCalledTimes(1);
});

test("doesn't call same listener multiple times with listeners", () => {
  const eventName = 'someSuperCoolEvent';

  // eslint-disable-next-line @eslint-react/no-missing-component-display-name
  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation } = useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return null;
  });

  const callback = jest.fn();

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen
          name="first"
          listeners={{ someSuperCoolEvent: callback }}
          component={React.Fragment}
        />
        <Screen
          name="second"
          listeners={{ someSuperCoolEvent: callback }}
          component={React.Fragment}
        />
        <Screen
          name="third"
          listeners={{ someSuperCoolEvent: callback }}
          component={React.Fragment}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(callback).toHaveBeenCalledTimes(0);

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(callback).toHaveBeenCalledTimes(1);
});

test('fires listeners when callback is provided for listeners prop', () => {
  const eventName = 'someSuperCoolEvent';

  // eslint-disable-next-line @eslint-react/no-missing-component-display-name
  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation } = useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return null;
  });

  const firstCallback: any = jest.fn();
  const secondCallback: any = jest.fn();
  const thirdCallback: any = jest.fn();

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen
          name="first"
          listeners={({ route, navigation }) => ({
            someSuperCoolEvent: (e) => firstCallback(e, route, navigation),
          })}
          component={React.Fragment}
        />
        <Screen
          name="second"
          listeners={({ route, navigation }) => ({
            someSuperCoolEvent: (e) => secondCallback(e, route, navigation),
          })}
          component={React.Fragment}
        />
        <Screen
          name="third"
          listeners={({ route, navigation }) => ({
            someSuperCoolEvent: (e) => thirdCallback(e, route, navigation),
          })}
          component={React.Fragment}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstCallback).toHaveBeenCalledTimes(0);
  expect(secondCallback).toHaveBeenCalledTimes(0);
  expect(thirdCallback).toHaveBeenCalledTimes(0);

  const target =
    ref.current.state.routes[ref.current.state.routes.length - 1].key;

  act(() => {
    ref.current.navigation.emit({
      type: eventName,
      target,
      data: 42,
    });
  });

  expect(firstCallback).toHaveBeenCalledTimes(0);
  expect(secondCallback).toHaveBeenCalledTimes(0);
  expect(thirdCallback).toHaveBeenCalledTimes(1);
  expect(thirdCallback.mock.calls[0][0].type).toBe('someSuperCoolEvent');
  expect(thirdCallback.mock.calls[0][0].data).toBe(42);
  expect(thirdCallback.mock.calls[0][0].target).toBe(target);
  expect(thirdCallback.mock.calls[0][0].defaultPrevented).toBeUndefined();
  expect(thirdCallback.mock.calls[0][0].preventDefault).toBeUndefined();

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(firstCallback.mock.calls[0][0].target).toBeUndefined();

  expect(firstCallback).toHaveBeenCalledTimes(1);
  expect(secondCallback).toHaveBeenCalledTimes(0);
  expect(thirdCallback).toHaveBeenCalledTimes(1);
});

test('has option to prevent default', () => {
  expect.assertions(5);

  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef(function TestNavigator(
    props: any,
    ref: any
  ): any {
    const { state, navigation, descriptors, NavigationContent } =
      useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  });

  const callback = (e: any) => {
    expect(e.type).toBe('someSuperCoolEvent');
    expect(e.data).toBe(42);
    expect(e.defaultPrevented).toBe(false);
    expect(e.preventDefault).toBeDefined();

    e.preventDefault();

    expect(e.defaultPrevented).toBe(true);
  };

  const Test = ({ navigation }: any) => {
    React.useEffect(
      () => navigation.addListener(eventName, callback),
      [navigation]
    );

    return null;
  };

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen name="first" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => {
    ref.current.navigation.emit({
      type: eventName,
      data: 42,
      canPreventDefault: true,
    });
  });
});

test('removes only one listener when unsubscribe is called multiple times', () => {
  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef(function TestNavigator(
    props: any,
    ref: any
  ): any {
    const { state, navigation, descriptors, NavigationContent } =
      useNavigationBuilder(MockRouter, props);

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  });

  const firstCallback = jest.fn();
  const secondCallback = jest.fn();

  const Test = ({ navigation }: any) => {
    React.useEffect(() => {
      const unsubscribe = navigation.addListener(eventName, firstCallback);
      unsubscribe();

      // this listener shouldn't be unsubscribed
      navigation.addListener(eventName, secondCallback);
      unsubscribe();
    }, [navigation]);

    return null;
  };

  const ref = React.createRef<any>();

  const element = (
    <BaseNavigationContainer>
      <TestNavigator ref={ref}>
        <Screen name="first" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(firstCallback).toHaveBeenCalledTimes(0);
  expect(secondCallback).toHaveBeenCalledTimes(0);

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(firstCallback).toHaveBeenCalledTimes(0);
  expect(secondCallback).toHaveBeenCalledTimes(1);
});
