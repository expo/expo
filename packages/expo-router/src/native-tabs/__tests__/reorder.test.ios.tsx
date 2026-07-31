import { act, screen } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';
import { Tabs } from 'react-native-screens';

import { store } from '../../global-state/router-store';
import { renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';

const TabsScreen = Tabs.Screen as jest.MockedFunction<typeof Tabs.Screen>;

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualModule,
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children }) => <View testID="TabsHost">{children}</View>),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
  };
});

it('NativeTabs does not throw when Trigger order changes after mount', () => {
  let flip!: Dispatch<SetStateAction<boolean>>;

  renderRouter(
    {
      _layout: function Layout() {
        const [flipped, setFlipped] = useState(false);
        flip = setFlipped;
        const names = flipped ? ['b', 'a'] : ['a', 'b'];
        return (
          <NativeTabs>
            {names.map((name) => (
              <NativeTabs.Trigger key={name} name={name} />
            ))}
          </NativeTabs>
        );
      },
      a: () => <Text testID="a">A</Text>,
      b: () => <Text testID="b">B</Text>,
    },
    { initialUrl: '/a' }
  );

  expect(screen.getByTestId('a')).toBeVisible();
  const previousState = store.navigationRef.current!.getRootState().routes[0]!.state!;
  const previousAKey = previousState.routes.find((route) => route.name === 'a')!.key;

  expect(() => act(() => flip(true))).not.toThrow();

  const state = store.navigationRef.current!.getRootState().routes[0]!.state!;
  expect(state.routeNames).toEqual(['b', 'a']);
  expect(state.routes.map((route) => route.name)).toEqual(['b', 'a']);
  expect(state.routes.find((route) => route.name === 'a')!.key).toBe(previousAKey);
  expect([TabsScreen.mock.calls.at(-2)![0].title, TabsScreen.mock.calls.at(-1)![0].title]).toEqual([
    'b',
    'a',
  ]);
  expect(screen.getByTestId('a')).toBeVisible();
});

it('NativeTabs does not throw when a Trigger is removed and added back after mount', () => {
  let setNames!: Dispatch<SetStateAction<string[]>>;

  const result = renderRouter(
    {
      _layout: function Layout() {
        // Undeclared filesystem routes are appended after the triggered ones, so
        // removing a trigger only reorders route names, it never removes them.
        const [names, setNamesState] = useState(['a', 'b']);
        setNames = setNamesState;
        return (
          <NativeTabs>
            {names.map((name) => (
              <NativeTabs.Trigger key={name} name={name} />
            ))}
          </NativeTabs>
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

  expect(() => act(() => setNames(['a', 'b']))).not.toThrow();
  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toEqual(['a', 'b']);
  expect(screen.getByTestId('a')).toBeVisible();
});
