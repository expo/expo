import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { getStateFromPath } from '../fork/getStateFromPath';
import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { getActionFromState } from '../react-navigation/native';
import { store } from '../global-state/store';
import { getMockConfig, renderRouter, screen } from '../testing-library';

// Deep links while the app runs (useLinking.native) and web history-forward events (useLinking)
// both dispatch `getActionFromState(getStateFromPath(url))`. That action must NAVIGATE-merge into
// the live tree, not RESET it: compiled states are now always keyed, and a key-based discriminator
// would turn every deep link into a whole-tree RESET that blows away unrelated back stacks.
it('deep-linking to a sibling branch merges instead of resetting the current back stack', () => {
  const app = {
    _layout: () => <Stack />,
    'a/_layout': () => <Stack />,
    'a/one': () => <Text testID="one">one</Text>,
    'a/two': () => <Text testID="two">two</Text>,
    'b/index': () => <Text testID="b">b</Text>,
  };

  renderRouter(app, { initialUrl: '/a/one' });

  // Build up a back stack in branch A.
  act(() => router.push('/a/two'));
  expect(screen).toHavePathname('/a/two');

  // Simulate the linking paths: compile the URL, derive the action, dispatch it on the container —
  // the exact mechanism both useLinking variants use.
  const config = getMockConfig(app);
  const state = getStateFromPath('/b', config)!;
  // `getActionFromState` is typed for partial (`stale?: true`) states but accepts complete ones at
  // runtime — the same coercion the useLinking call sites rely on.
  const action = getActionFromState(state as any, config as any)!;

  // Compiled (keyed) states must still take the fine-grained NAVIGATE path.
  expect(action.type).toBe('NAVIGATE');

  act(() => {
    store.navigationRef.current?.dispatch(action);
  });
  expect(screen).toHavePathname('/b');

  // Branch A's stack survived the deep link: going back lands on /a/two, not a reset tree.
  act(() => router.back());
  expect(screen).toHavePathname('/a/two');
  expect(screen.getByTestId('two')).toBeVisible();
});
