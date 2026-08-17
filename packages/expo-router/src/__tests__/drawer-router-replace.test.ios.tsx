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

it('removes the replaced drawer route from history', () => {
  renderRouter({
    _layout: () => <Drawer backBehavior="history" />,
    index: () => null,
    second: () => null,
    third: () => null,
  });

  act(() => router.push('/second'));
  act(() => router.push('/third'));
  act(() => router.replace('/'));

  act(() => router.back());
  expect(screen).toHavePathname('/second');
});
