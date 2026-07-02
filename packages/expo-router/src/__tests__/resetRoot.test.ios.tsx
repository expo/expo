import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { getMockConfig, renderRouter, screen } from '../testing-library';
import { getStateFromPath } from '../fork/getStateFromPath';

// Browser back/forward (and the native linking fallback) reset the app by handing the compiled
// `getStateFromPath` output to `navigationRef.resetRoot`. Compiled states now carry deterministic
// keys (e.g. the root state key is `navigator`), which never equal the live root navigator's random
// `stack-<nanoid>` key. `resetRoot` must therefore target the LIVE root key, not the incoming
// state's key — otherwise the RESET action is unhandled and the reset silently no-ops.
it('resetRoot with a compiled state resets to that state', () => {
  const app = {
    _layout: () => <Stack />,
    index: () => <Text>index</Text>,
    second: () => <Text>second</Text>,
  };

  renderRouter(app, { initialUrl: '/' });
  expect(screen).toHavePathname('/');

  // Move off the target so the reset has to actually change the state.
  act(() => router.navigate('/second'));
  expect(screen).toHavePathname('/second');

  const compiled = getStateFromPath('/', getMockConfig(app));

  // In test env an unhandled action throws (see ExpoRoot `onUnhandledAction`), so a mis-targeted
  // RESET would fail this call outright.
  act(() => {
    store.navigationRef.current?.resetRoot(compiled);
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByText('index')).toBeVisible();
});
