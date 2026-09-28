import { act, screen } from '@testing-library/react-native';

import { router } from '../imperative-api';
import { Tabs } from '../layouts/Tabs';
import { Redirect } from '../link/Link';
import { renderRouter } from '../testing-library';

it('removes the replaced tab from history', () => {
  renderRouter({
    _layout: () => (
      <Tabs backBehavior="history">
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
        <Tabs.Screen name="third" />
      </Tabs>
    ),
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

it('removes a redirecting tab from history', () => {
  renderRouter({
    _layout: () => (
      <Tabs backBehavior="history">
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
        <Tabs.Screen name="third" />
        <Tabs.Screen name="redirected" />
      </Tabs>
    ),
    index: () => null,
    second: () => null,
    third: () => null,
    redirected: () => <Redirect href="/" />,
  });

  act(() => router.push('/second'));
  act(() => router.push('/third'));
  act(() => router.push('/redirected'));

  expect(screen).toHavePathname('/');
  act(() => router.back());
  expect(screen).toHavePathname('/third');
});
