import React, { Text } from 'react-native';

import { Slot, useGlobalSearchParams } from '../exports';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { Redirect } from '../link/Link';
import { renderRouter, screen } from '../testing-library';

it('404', async () => {
  const Index = jest.fn(() => <Redirect href="/404" />);

  renderRouter({
    index: Index,
  });

  expect(await screen.findByText('Unmatched Route')).toBeOnTheScreen();
  expect(screen).toHavePathname('/404');
  expect(screen).toHaveSegments(['[...404]']);
  expect(screen).toHaveSearchParams({ '404': '404' });
});

it('can render a route', async () => {
  renderRouter({
    index: () => <Text>Hello</Text>,
  });

  expect(await screen.findByText('Hello')).toBeOnTheScreen();
  expect(screen).toHavePathname('/');
  expect(screen).toHaveSegments([]);
  expect(screen).toHaveSearchParams({});
});

it('can handle dynamic routes', async () => {
  renderRouter(
    {
      '[slug]': function Path() {
        const { slug } = useGlobalSearchParams();
        return <Text>{slug}</Text>;
      },
    },
    {
      initialUrl: '/test-path',
    }
  );

  expect(await screen.findByText('test-path')).toBeOnTheScreen();

  expect(screen).toHavePathname('/test-path');
  expect(screen).toHaveSegments(['[slug]']);
  expect(screen).toHaveSearchParams({
    slug: 'test-path',
  });
});

it('does not rerender routes', async () => {
  const Index = jest.fn(() => <Text>Screen</Text>);

  renderRouter({
    index: Index,
  });

  expect(await screen.findByText('Screen')).toBeOnTheScreen();
  expect(Index).toHaveBeenCalledTimes(1);
});

it('redirects', async () => {
  const Index = jest.fn(() => <Redirect href="/other" />);
  const Other = jest.fn(() => <Text>Other</Text>);

  renderRouter({
    '(app)/index': Index,
    '(app)/other': Other,
  });

  expect(await screen.findByText('Other')).toBeOnTheScreen();
  expect(Index).toHaveBeenCalledTimes(1);
  expect(Other).toHaveBeenCalledTimes(1);
});

it('layouts', async () => {
  const Layout = jest.fn(() => <Slot />);
  const Index = jest.fn(() => <Redirect href="/other" />);
  const Other = jest.fn(() => <Text>Other</Text>);

  renderRouter({
    '(app)/_layout': Layout,
    '(app)/index': Index,
    '(app)/other': Other,
  });

  expect(await screen.findByText('Other')).toBeOnTheScreen();
  expect(Layout).toHaveBeenCalledTimes(2);
  expect(Index).toHaveBeenCalledTimes(1);
  expect(Other).toHaveBeenCalledTimes(1);
});

it('nested layouts', async () => {
  const RootLayout = jest.fn(() => <Slot />);
  const AppLayout = jest.fn(() => <Slot />);
  const TabsLayout = jest.fn(() => <Tabs />);
  const StackLayout = jest.fn(() => <Stack />);

  const Index = jest.fn(() => <Redirect href="/home" />);
  const Home = jest.fn(() => <Redirect href="/home/nested" />);
  const HomeNested = jest.fn(() => <Text>HomeNested</Text>);

  renderRouter({
    _layout: RootLayout,
    '(app)/_layout': AppLayout,
    '(app)/index': Index,
    '(app)/(tabs)/_layout': TabsLayout,
    '(app)/(tabs)/home/_layout': StackLayout,
    '(app)/(tabs)/home/index': Home,
    '(app)/(tabs)/home/nested': HomeNested,
  });

  expect(await screen.findByText('HomeNested')).toBeOnTheScreen();

  expect(AppLayout).toHaveBeenCalledTimes(3);
  expect(TabsLayout).toHaveBeenCalledTimes(2);
  expect(StackLayout).toHaveBeenCalledTimes(2);
  expect(Index).toHaveBeenCalledTimes(1);
  expect(Home).toHaveBeenCalledTimes(1);
  expect(HomeNested).toHaveBeenCalledTimes(1);
});
