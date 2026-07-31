import 'react-native-gesture-handler/jestSetup';
import { act, screen } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';

import { store } from '../global-state/router-store';
import Drawer from '../layouts/Drawer';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import TopTabs from '../layouts/TopTabs';
import { renderRouter } from '../testing-library';

jest.mock('react-native-drawer-layout', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-drawer-layout'
  ) as typeof import('react-native-drawer-layout');
  return {
    ...actual,
    Drawer: jest.fn(({ children, renderDrawerContent }) => (
      <View>
        {renderDrawerContent()}
        {children}
      </View>
    )),
  };
});

const getNavigatorState = () => store.navigationRef.current!.getRootState().routes[0]!.state!;

it.each([
  ['Stack', Stack, null],
  ['Tabs', Tabs, 'tabBarLabel'],
  ['TopTabs', TopTabs, 'tabBarLabel'],
  ['Drawer', Drawer, 'drawerLabel'],
] as const)(
  '%s does not throw when Screen order changes after mount',
  (_, Navigator, labelOption) => {
    let flip!: Dispatch<SetStateAction<boolean>>;

    renderRouter(
      {
        _layout: function Layout() {
          const [flipped, setFlipped] = useState(false);
          flip = setFlipped;
          const names = flipped ? ['b', 'a'] : ['a', 'b'];
          return (
            <Navigator id={undefined}>
              {names.map((name) => (
                <Navigator.Screen
                  key={name}
                  name={name}
                  options={labelOption ? { [labelOption]: `item-${name}` } : undefined}
                />
              ))}
            </Navigator>
          );
        },
        a: () => <Text testID="a">A</Text>,
        b: () => <Text testID="b">B</Text>,
      },
      { initialUrl: '/a' }
    );

    expect(screen.getByTestId('a')).toBeVisible();
    const previousState = getNavigatorState();
    const previousRoutes = Object.fromEntries(
      previousState.routes.map((route) => [route.name, route])
    );

    expect(() => act(() => flip(true))).not.toThrow();

    const state = getNavigatorState();
    expect(state.routeNames).toEqual(['b', 'a']);
    if (state.type !== 'stack') {
      expect(state.routes.map((route) => route.name)).toEqual(['b', 'a']);
    }
    expect(state.routes.find((route) => route.name === 'a')!.key).toBe(previousRoutes.a!.key);
    if (labelOption) {
      const renderedLabels = screen
        .getAllByText(/^item-/)
        .map((label) => label.props.children as string)
        .filter((label, index, labels) => label !== labels[index - 1]);
      expect(renderedLabels).toEqual(['item-b', 'item-a']);
    }
    expect(screen.getByTestId('a')).toBeVisible();
  }
);

it.each([
  ['Stack', Stack],
  ['Tabs', Tabs],
  ['TopTabs', TopTabs],
  ['Drawer', Drawer],
] as const)(
  '%s does not throw when a Screen declaration is removed and added back after mount',
  (_, Navigator) => {
    let setNames!: Dispatch<SetStateAction<string[]>>;

    const result = renderRouter(
      {
        _layout: function Layout() {
          // Undeclared filesystem routes are appended after the declared ones, so
          // removing a declaration only reorders route names, it never removes them.
          const [names, setNamesState] = useState(['a', 'b']);
          setNames = setNamesState;
          return (
            <Navigator id={undefined}>
              {names.map((name) => (
                <Navigator.Screen key={name} name={name} />
              ))}
            </Navigator>
          );
        },
        a: () => <Text testID="a">A</Text>,
        b: () => <Text testID="b">B</Text>,
      },
      { initialUrl: '/a' }
    );

    expect(screen.getByTestId('a')).toBeVisible();

    expect(() => act(() => setNames(['b']))).not.toThrow();
    expect(result.getRouterState()!.routes[0]!.state!.routeNames).toEqual(['b', 'a']);
    expect(screen.getByTestId('a')).toBeVisible();

    expect(() => act(() => setNames(['a', 'b']))).not.toThrow();
    expect(result.getRouterState()!.routes[0]!.state!.routeNames).toEqual(['a', 'b']);
    expect(screen.getByTestId('a')).toBeVisible();
  }
);
