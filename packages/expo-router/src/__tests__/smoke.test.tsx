import React, { Text } from 'react-native';

import { Slot, useRouter, useSearchParams } from '../exports';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { Redirect } from '../link/Link';
import { act, fireEvent, renderRouter, screen } from '../testing-library';

it('404', async () => {
  const Index = jest.fn(() => <Redirect href="/404" />);

  renderRouter({
    index: Index,
  });

  expect(await screen.findByText('Unmatched Route')).toBeDefined();
});

it('can render a route', async () => {
  renderRouter({
    index: () => <Text>Hello</Text>,
  });

  expect(await screen.findByText('Hello')).toBeDefined();
});

it('can handle dynamic routes', async () => {
  renderRouter(
    {
      '[slug]': function Path() {
        const { slug } = useSearchParams();
        return <Text>{slug}</Text>;
      },
    },
    {
      initialUrl: '/test-path',
    }
  );

  expect(await screen.findByText('test-path')).toBeDefined();

  expect(screen).toHavePathname('/[slug]');
  expect(screen).toHaveSearchParams({
    slug: 'test-path',
  });
});

it('can handle navigation between routes', async () => {
  renderRouter({
    index: function MyIndexRoute() {
      const router = useRouter();

      return (
        <Text testID="index" onPress={() => router.push('/profile/test-name')}>
          Press me
        </Text>
      );
    },
    '/profile/[name]': function MyRoute() {
      const { name } = useSearchParams();
      return <Text>{name}</Text>;
    },
  });

  const text = await screen.findByTestId('index');

  act(() => {
    fireEvent.press(text);
  });

  expect(await screen.findByText('test-name')).toBeDefined();
});

it('does not rerender routes', async () => {
  const Index = jest.fn(() => <Text>Screen</Text>);

  renderRouter({
    index: Index,
  });

  expect(await screen.findByText('Screen')).toBeDefined();
  expect(Index).toHaveBeenCalledTimes(1);
});

it('redirects', async () => {
  const Index = jest.fn(() => <Redirect href="/other" />);
  const Other = jest.fn(() => <Text>Other</Text>);

  renderRouter({
    '(app)/index': Index,
    '(app)/other': Other,
  });

  expect(await screen.findByText('Other')).toBeDefined();
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

  expect(await screen.findByText('Other')).toBeDefined();
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

  expect(await screen.findByText('HomeNested')).toBeDefined();

  expect(AppLayout).toHaveBeenCalledTimes(3);
  expect(TabsLayout).toHaveBeenCalledTimes(2);
  expect(StackLayout).toHaveBeenCalledTimes(3);
  expect(Index).toHaveBeenCalledTimes(1);
  expect(Home).toHaveBeenCalledTimes(2);
  expect(HomeNested).toHaveBeenCalledTimes(1);
});
