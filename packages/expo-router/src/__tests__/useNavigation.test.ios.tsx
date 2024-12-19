import { NavigationProp } from '@react-navigation/native';
import React from 'react';

import Stack from '../layouts/Stack';
import { renderRouter } from '../testing-library';
import { useNavigation } from '../useNavigation';

type Navigation =
  | ReturnType<typeof useNavigation<NavigationProp<ReactNavigation.RootParamList>>>
  | undefined;

it('can resolve the base navigator', () => {
  let navigation: Navigation;

  renderRouter({
    index: function Index() {
      navigation = useNavigation();

      return null;
    },
  });

  expect(navigation).toBeDefined();
  // This is the base navigator when there are no layout files
  expect(navigation?.getId()).toBe('/expo-router/build/views/Navigator');
});

it('can resolve the root navigator', () => {
  let navigation: Navigation;

  renderRouter({
    index: function Index() {
      navigation = useNavigation();

      return null;
    },
    _layout: () => <Stack />,
  });

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('');
});

it('can resolve the root navigator via "/"', () => {
  let navigation: Navigation;

  renderRouter({
    index: function Index() {
      navigation = useNavigation('/');

      return null;
    },
    _layout: () => <Stack />,
  });

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('');
});

it('can resolve the root navigator via "/" when nested', () => {
  let navigation: Navigation;

  renderRouter({
    '(a)/_layout': () => <Stack />,
    '(a)/(b)/_layout': () => <Stack />,
    '(a)/(b)/index': function Index() {
      navigation = useNavigation('/');

      return null;
    },
    _layout: () => <Stack />,
  });

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('');
});

it('can resolve a parent navigator via relative paths', () => {
  let navigation: Navigation;

  renderRouter({
    '(a)/_layout': () => <Stack />,
    '(a)/(b)/_layout': () => <Stack />,
    '(a)/(b)/index': function Index() {
      navigation = useNavigation('../');

      return null;
    },
    _layout: () => <Stack />,
  });

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('/(a)');
});

it('can resolve a parent navigator via missing groups', () => {
  let navigation: Navigation;

  renderRouter(
    {
      '(a)/_layout': () => <Stack />,
      '(a)/target/_layout': () => <Stack />,
      '(a)/target/(b)/_layout': () => <Stack />,
      '(a)/target/(b)/index': function Index() {
        navigation = useNavigation('/(a)/target');

        return null;
      },
      _layout: () => <Stack />,
    },
    {
      initialUrl: '/target',
    }
  );

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('/(a)/target');
});

it('works with hoisted routes and relative hrefs', () => {
  let navigation: Navigation;

  renderRouter(
    {
      '(a)/_layout': () => <Stack />,
      '(a)/hoisted/(b)/_layout': () => <Stack />,
      '(a)/hoisted/(b)/index': function Index() {
        navigation = useNavigation('../');

        return null;
      },
      _layout: () => <Stack />,
    },
    {
      initialUrl: '/hoisted',
    }
  );

  expect(navigation).toBeDefined();
  // Moving up one level should resolve to /(a) because this the closest parent navigator
  expect(navigation?.getId()).toBe('/(a)');
});
