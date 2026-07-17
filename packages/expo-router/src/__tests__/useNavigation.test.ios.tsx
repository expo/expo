import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import Stack from '../layouts/Stack';
import type { NavigationProp } from '../react-navigation/native';
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

it('can resolve the parent of a nested navigator', () => {
  let navigation: Navigation;

  renderRouter({
    _layout: () => <Stack />,
    '(app)/_layout': () => <Stack />,
    '(app)/index': function Index() {
      navigation = useNavigation();

      return null;
    },
  });

  expect(navigation).toBeDefined();
  // Narrows type for TypeScript
  if (!navigation) throw new Error('Expected navigation to be defined');
  expect(navigation.getId()).toBe('/(app)');
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

// The public `navigation.navigate`/`push` are routed through the href pipeline under the hood, so a
// name (relative to the current route) resolves to a URL and navigates the same as `router.*`.
it('routes navigate() through the href pipeline', () => {
  let navigation: Navigation;

  renderRouter({
    index: function Index() {
      navigation = useNavigation();
      return <Text testID="index">index</Text>;
    },
    foo: () => <Text testID="foo">foo</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  act(() => (navigation as any).navigate('foo'));

  expect(screen.getByTestId('foo')).toBeVisible();
  expect(screen).toHavePathname('/foo');
});

it('routes the nested navigate({ screen }) form through the href pipeline', () => {
  let navigation: Navigation;

  renderRouter({
    index: function Index() {
      navigation = useNavigation();
      return <Text testID="index">index</Text>;
    },
    'a/_layout': () => <Stack />,
    'a/b': () => <Text testID="b">b</Text>,
    'a/c': () => <Text testID="c">c</Text>,
  });

  act(() => (navigation as any).navigate('a', { screen: 'c' }));

  expect(screen.getByTestId('c')).toBeVisible();
  expect(screen).toHavePathname('/a/c');
});
