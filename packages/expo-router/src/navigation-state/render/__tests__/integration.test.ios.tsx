import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { usePathname } from '../../../hooks';
import { router } from '../../../imperative-api';
import { Stack } from '../../../layouts/Stack';
import { renderRouter, screen } from '../../../testing-library';
import { __resetNewStateModelForTests, enableNewStateModel } from '../../enable';
import { __resetRouterRegistryForTests } from '../../routerRegistry';
import { getNavSnapshot, useOptionalNavigationTree } from '../../store';

// R-Phase C — end-to-end through the REAL ExpoRoot under the flag: the app boots from the new tree,
// router.push/back navigate, usePathname reflects the projected URL. (jest; on-device pending — R-7.)

function PathProbe() {
  return <Text testID="pathname">{usePathname()}</Text>;
}

beforeEach(() => enableNewStateModel());
afterEach(() => {
  __resetNewStateModelForTests();
  __resetRouterRegistryForTests();
});

it('boots a Stack app from the new state model and renders the initial screen', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    details: () => <Text testID="details">Details</Text>,
  });
  expect(screen.getByTestId('index')).toBeVisible();
});

it('router.push and router.back navigate, and usePathname tracks the new model', () => {
  renderRouter({
    _layout: () => (
      <>
        <PathProbe />
        <Stack />
      </>
    ),
    index: () => <Text testID="index">Index</Text>,
    details: () => <Text testID="details">Details</Text>,
  });
  expect(screen.getByTestId('pathname')).toHaveTextContent('/');

  act(() => router.push('/details'));
  expect(screen.getByTestId('details')).toBeVisible();
  expect(screen.getByTestId('pathname')).toHaveTextContent('/details');

  act(() => router.back());
  expect(screen.getByTestId('pathname')).toHaveTextContent('/');
});

it('boots from a deep link (initial URL other than /)', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => <Text testID="index">Index</Text>,
      details: () => <Text testID="details">Details</Text>,
    },
    { initialUrl: '/details' }
  );
  expect(screen.getByTestId('details')).toBeVisible();
});

it('mounts the new provider (not the react-navigation container)', () => {
  let mounted = false;
  function Probe() {
    // Non-null only when NavigationStateProvider is mounted — proves the new path, not a fallback.
    mounted = useOptionalNavigationTree() != null;
    return null;
  }
  renderRouter({
    _layout: () => (
      <>
        <Probe />
        <Stack />
      </>
    ),
    index: () => <Text testID="index">Index</Text>,
  });
  expect(mounted).toBe(true);
});

it('KNOWN LIMIT (R-10): router.push behaves as navigate (no duplicate of the current route)', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    details: () => <Text testID="details">Details</Text>,
  });
  act(() => router.push('/details'));
  act(() => router.push('/details')); // a second push to the same route
  // Navigate semantics: focused on details, no duplicate entry (push-vs-navigate is deferred).
  expect(getNavSnapshot()!.root.routes.filter((r) => r.name === 'details')).toHaveLength(1);
});
