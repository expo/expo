import { act, screen } from '@testing-library/react-native';

import { router } from '../imperative-api';
import { Tabs } from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

it('removes the replaced tab from history', () => {
  renderRouter({
    _layout: () => <Tabs backBehavior="history" />,
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
