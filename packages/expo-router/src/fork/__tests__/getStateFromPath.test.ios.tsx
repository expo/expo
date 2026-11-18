import { use } from 'react';
import { Text } from 'react-native';

import { LocalRouteParamsContext } from '../../Route';
import { router } from '../../imperative-api';
import { Stack } from '../../layouts/Stack';
import { act, renderRouter, screen } from '../../testing-library';
import { Slot } from '../../views/Navigator';

it('gives the layout its own param on the initial URL when a child reuses the param name', async () => {
  await renderRouter(
    {
      '[team]/_layout': function Layout() {
        // `useLocalSearchParams` in a layout merges focused child params, so read the layout route params.
        const params = use(LocalRouteParamsContext) as { team?: string };
        return (
          <>
            <Text testID="layout-team">{params.team}</Text>
            <Slot />
          </>
        );
      },
      '[team]/index': () => <Text testID="home">Home</Text>,
      '[team]/details/_layout': () => <Stack />,
      '[team]/details/index': () => <Text testID="details">Details</Text>,
      '[team]/details/[team]': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/alpha/details/beta' }
  );

  expect(screen.getByTestId('child')).toBeVisible();
  expect(screen.getByTestId('layout-team')).toHaveTextContent('alpha');
});

it('gives the layout its own param after a push when a child reuses the param name', async () => {
  await renderRouter(
    {
      '[team]/_layout': function Layout() {
        // `useLocalSearchParams` in a layout merges focused child params, so read the layout route params.
        const params = use(LocalRouteParamsContext) as { team?: string };
        return (
          <>
            <Text testID="layout-team">{params.team}</Text>
            <Slot />
          </>
        );
      },
      '[team]/index': () => <Text testID="home">Home</Text>,
      '[team]/details/_layout': () => <Stack />,
      '[team]/details/index': () => <Text testID="details">Details</Text>,
      '[team]/details/[team]': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/alpha/details' }
  );

  await act(() => router.push('/alpha/details/beta'));

  expect(screen.getByTestId('child')).toBeVisible();
  expect(screen.getByTestId('layout-team')).toHaveTextContent('alpha');
});

it('goes back to the parent screen when a pushed child reuses the param name', async () => {
  const result = await renderRouter(
    {
      '[team]/_layout': () => <Slot />,
      '[team]/index': () => <Text testID="home">Home</Text>,
      '[team]/details/_layout': () => <Stack />,
      '[team]/details/index': () => <Text testID="details">Details</Text>,
      '[team]/details/[team]': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/alpha/details' }
  );

  await act(() => router.push('/alpha/details/beta'));
  expect(screen.getByTestId('child')).toBeVisible();

  await act(() => router.back());

  expect(screen.getByTestId('details')).toBeVisible();
  expect(result.getPathname()).toBe('/alpha/details');
});
