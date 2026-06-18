import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../../../imperative-api';
import { ExperimentalStack } from '../../../layouts/experimental-stack';
import { renderRouter, screen } from '../../../testing-library';
import { __resetNewStateModelForTests, enableNewStateModel } from '../../enable';
import { __resetRouterRegistryForTests } from '../../routerRegistry';
import { getNavSnapshot } from '../../store';

// R-Phase E — ExperimentalStack renders from the new tree via the shared stack factory (Decisions
// R-2/R-10): same projection + shim + providers as Stack, only the view differs.

beforeEach(() => enableNewStateModel());
afterEach(() => {
  __resetNewStateModelForTests();
  __resetRouterRegistryForTests();
});

it('boots and navigates an ExperimentalStack app from the new model', () => {
  renderRouter({
    _layout: () => <ExperimentalStack />,
    index: () => <Text testID="index">Index</Text>,
    details: () => <Text testID="details">Details</Text>,
  });
  expect(screen.getByTestId('index')).toBeVisible();

  act(() => router.push('/details'));
  expect(screen.getByTestId('details')).toBeVisible();
  expect(getNavSnapshot()!.root.routes.map((r) => r.name)).toEqual(['index', 'details']);

  act(() => router.back());
  expect(getNavSnapshot()!.root.routes.map((r) => r.name)).toEqual(['index']);
});
