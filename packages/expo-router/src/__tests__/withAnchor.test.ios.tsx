import React from 'react';
import { Text } from 'react-native';

import { Link, Slot, router } from '../exports';
import Stack from '../layouts/Stack';
import { act, fireEvent, renderRouter, screen } from '../testing-library';

it('can preserve the initialRoute', () => {
  renderRouter({
    index: function MyIndexRoute() {
      return (
        <Link testID="link" withAnchor href="/fruit/banana">
          Press me
        </Link>
      );
    },
    '/fruit/_layout': {
      unstable_settings: {
        anchor: 'apple',
      },
      default: () => {
        return <Stack />;
      },
    },
    '/fruit/apple': () => <Text testID="apple">Apple</Text>,
    '/fruit/banana': () => <Text testID="banana">Banana</Text>,
  });

  act(() => fireEvent.press(screen.getByTestId('link')));

  expect(screen.getByTestId('banana')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('apple')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('link')).toBeDefined();
});

it('can preserve the initialRoute with shared groups', () => {
  renderRouter({
    index: function MyIndexRoute() {
      return (
        <Link testID="link" withAnchor href="/(foo)/fruit/banana">
          Press me
        </Link>
      );
    },
    '/(foo,bar)/fruit/_layout': {
      unstable_settings: {
        anchor: 'apple',
        foo: {
          anchor: 'orange',
        },
      },
      default: () => {
        return <Stack />;
      },
    },
    '/(foo,bar)/fruit/apple': () => <Text testID="apple">Apple</Text>,
    '/(foo,bar)/fruit/orange': () => <Text testID="orange">Orange</Text>,
    '/(foo,bar)/fruit/banana': () => <Text testID="banana">Banana</Text>,
  });

  act(() => fireEvent.press(screen.getByTestId('link')));
  expect(screen.getByTestId('banana')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('orange')).toBeDefined();
  act(() => router.back());
  expect(screen.getByTestId('link')).toBeDefined();
});

it('works with when linking to a subgroup using withAnchor', () => {
  renderRouter({
    _layout: function Layout() {
      return <Slot />;
    },
    '(group)/_layout': () => <Stack />,
    '(group)/index': () => <Link testID="link" href="/profile/1" withAnchor />,
    '(group)/(a)/_layout': {
      unstable_settings: {
        anchor: 'feed',
      },
      default: function Layout() {
        return <Stack />;
      },
    },
    '(group)/(a)/feed': () => <Text testID="feed">Feed</Text>,
    '(group)/(a)/profile/[id]': () => <Text testID="profile">Profile</Text>,
  });

  act(() => fireEvent.press(screen.getByTestId('link')));

  expect(screen.getByTestId('profile')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('feed')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('link')).toBeDefined();

  expect(router.canGoBack()).toBe(false);
});

it('works with linking deeply using withAnchor', () => {
  renderRouter({
    _layout: function Layout() {
      return <Slot />;
    },
    '(group)/_layout': () => <Stack />,
    '(group)/index': () => <Link testID="link" href="profile/1" withAnchor />,
    '(group)/(a)/_layout': {
      unstable_settings: {
        anchor: 'anchor-a',
      },
      default: function Layout() {
        return <Stack />;
      },
    },
    '(group)/(a)/anchor-a': () => <Text testID="anchor-a">Anchor A</Text>,
    '(group)/(a)/(b)/_layout': {
      unstable_settings: {
        anchor: 'anchor-b',
      },
      default: function Layout() {
        return <Stack />;
      },
    },
    '(group)/(a)/(b)/anchor-b': () => <Text testID="anchor-b">Anchor B</Text>,
    '(group)/(a)/(b)/profile/[id]': () => <Text testID="profile">Profile</Text>,
  });

  act(() => fireEvent.press(screen.getByTestId('link')));

  expect(screen.getByTestId('profile')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('anchor-b')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('anchor-a')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('link')).toBeDefined();

  expect(router.canGoBack()).toBe(false);
});

it('works with redirect withAnchor=target', () => {
  renderRouter({
    _layout: function Layout() {
      return <Slot />;
    },
    '(group)/_layout': () => <Stack />,
    '(group)/index': () => <Link testID="link" href="profile/1" withAnchor="target" />,
    '(group)/(a)/_layout': {
      unstable_settings: {
        anchor: 'anchor-a',
      },
      default: function Layout() {
        return <Stack />;
      },
    },
    '(group)/(a)/anchor-a': () => <Text testID="anchor-a">Anchor A</Text>,
    '(group)/(a)/(b)/_layout': {
      unstable_settings: {
        anchor: 'anchor-b',
      },
      default: function Layout() {
        return <Stack />;
      },
    },
    '(group)/(a)/(b)/anchor-b': () => <Text testID="anchor-b">Anchor B</Text>,
    '(group)/(a)/(b)/profile/[id]': () => <Text testID="profile">Profile</Text>,
  });

  act(() => fireEvent.press(screen.getByTestId('link')));

  expect(screen.getByTestId('profile')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('anchor-b')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  // Skips anchor-a because withAnchor=target

  expect(screen.getByTestId('link')).toBeDefined();

  expect(router.canGoBack()).toBe(false);
});
