import { act, screen } from '@testing-library/react-native';

import { router } from '../imperative-api';
import { Drawer } from '../layouts/Drawer';
import { renderRouter } from '../testing-library';

jest.mock('react-native-drawer-layout', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const actual = jest.requireActual(
    'react-native-drawer-layout'
  ) as typeof import('react-native-drawer-layout');

  return {
    ...actual,
    Drawer: ({ children }: React.PropsWithChildren) =>
      React.createElement(React.Fragment, null, children),
  };
});

it('removes the replaced drawer route from history', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter({
    _layout: () => (
      <Drawer backBehavior="history">
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" />
        <Drawer.Screen name="third" />
      </Drawer>
    ),
    index: () => null,
    second: () => null,
    third: () => null,
  });

  await act(() => router.push('/second'));
  await act(() => router.push('/third'));
  await act(() => router.replace('/'));

  await act(() => router.back());
  expect(screen).toHavePathname('/second');
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});
