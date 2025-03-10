import React from 'react';
import { Text } from 'react-native';

import { Redirect, Slot, router, useLocalSearchParams } from '../exports';
import Stack from '../layouts/Stack';
import { act, renderRouter, screen } from '../testing-library';

it('redirect works with withAnchor', () => {
  renderRouter({
    index: () => <Redirect href="/profile/1" withAnchor />,
    _layout: () => <Stack />,
    '(group)/_layout': {
      unstable_settings: {
        anchor: 'feed',
      },
      default: function Layout() {
        return <Stack />;
      },
    },
    '(group)/feed': () => <Text testID="feed">Feed</Text>,
    '(group)/profile/[id]': () => <Text testID="profile">Profile</Text>,
  });

  expect(screen.getByTestId('profile')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('feed')).toBeDefined();
});

it('works with when redirecting to a subgroup using withAnchor', () => {
  renderRouter({
    _layout: function Layout() {
      return <Slot />;
    },
    '(group)/_layout': function Layout() {
      const { id } = useLocalSearchParams();

      if (!id) {
        return <Redirect href="profile/1" withAnchor />;
      }

      return <Stack />;
    },
    '(group)/index': () => <Text testID="index">Index</Text>,
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

  expect(screen.getByTestId('profile')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('feed')).toBeDefined();

  expect(router.canGoBack()).toBe(false);
});

it('works with redirecting deeply using withAnchor', () => {
  renderRouter({
    _layout: function Layout() {
      return <Slot />;
    },
    '(group)/_layout': function Layout() {
      const { id } = useLocalSearchParams();

      if (!id) {
        return <Redirect href="profile/1" withAnchor />;
      }

      return <Stack />;
    },
    '(group)/index': () => <Text testID="index">Index</Text>,
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

  expect(screen.getByTestId('profile')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('anchor-b')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('anchor-a')).toBeDefined();

  expect(router.canGoBack()).toBe(false);
});

it('works with redirect withAnchor=target', () => {
  renderRouter({
    _layout: function Layout() {
      return <Slot />;
    },
    '(group)/_layout': function Layout() {
      const { id } = useLocalSearchParams();

      if (!id) {
        return <Redirect href="profile/1" withAnchor="target" />;
      }

      return <Stack />;
    },
    '(group)/index': () => <Text testID="index">Index</Text>,
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

  expect(screen.getByTestId('profile')).toBeDefined();

  expect(router.canGoBack()).toBe(true);
  act(() => router.back());

  expect(screen.getByTestId('anchor-b')).toBeDefined();

  expect(router.canGoBack()).toBe(false);
});
