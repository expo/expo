import { act } from '@testing-library/react-native';

import { store } from '../store';
import { router } from '../../imperative-api';
import Stack from '../../layouts/StackClient';
import Tabs from '../../layouts/Tabs';
import { renderRouter } from '../../testing-library';

/**
 * `canDismiss()` answers: would the `POP` that `router.dismiss()` dispatches be handled by some
 * navigator on the focused chain? Each fixture below pairs the predicted answer with a parity
 * check that actually dispatches `dismiss()` and asserts the navigation state changed iff
 * `canDismiss()` was `true`.
 */

// Read the committed navigation state directly — the same source `canDismiss()` simulates against.
const committedState = () => store.navigationRef.current?.getRootState();

function expectDismissMatchesCanDismiss() {
  const canDismiss = router.canDismiss();
  const before = JSON.stringify(committedState());
  // When the POP isn't handled, the store rethrows the unhandled-action warning (test env only;
  // production just logs it). That rethrow tears the container down, so an unhandled dismiss ends
  // with no committed state at all — which is still "no state change", since nothing was reduced.
  try {
    act(() => router.dismiss());
  } catch (e) {
    if (!String(e).includes('was not handled by any navigator')) {
      throw e;
    }
  }
  const after = committedState();
  const changed = after != null && JSON.stringify(after) !== before;
  expect(changed).toBe(canDismiss);
  return canDismiss;
}

it('single stack with one route cannot dismiss', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      a: () => null,
      b: () => null,
    },
    { initialUrl: '/a' }
  );

  expect(router.canDismiss()).toBe(false);
  expect(expectDismissMatchesCanDismiss()).toBe(false);
});

it('stack after a push can dismiss', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      a: () => null,
      b: () => null,
    },
    { initialUrl: '/a' }
  );

  act(() => router.push('/b'));

  expect(router.canDismiss()).toBe(true);
  expect(expectDismissMatchesCanDismiss()).toBe(true);
});

it('tabs with no stack history cannot dismiss even though it can go back', () => {
  renderRouter(
    {
      _layout: () => <Tabs />,
      a: () => null,
      b: () => null,
    },
    { initialUrl: '/a' }
  );

  act(() => router.navigate('/b'));

  // GO_BACK is handled by the tab router (returns to the first tab), so canGoBack is true.
  expect(router.canGoBack()).toBe(true);
  // POP is not handled by any navigator, so canDismiss is false — this pins the distinction.
  expect(router.canDismiss()).toBe(false);
  expect(expectDismissMatchesCanDismiss()).toBe(false);
});

it('ancestor stack is poppable while focused inside nested tabs', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => null,
      'nested/_layout': () => <Tabs />,
      'nested/a': () => null,
      'nested/b': () => null,
    },
    { initialUrl: '/' }
  );

  // Stack now has two routes: [index, nested]; focus is inside the tab navigator.
  act(() => router.push('/nested/a'));

  expect(router.canDismiss()).toBe(true);
  expect(expectDismissMatchesCanDismiss()).toBe(true);
});

it('stack at index 0 with a preloaded tail route cannot dismiss', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      a: () => null,
      b: () => null,
    },
    { initialUrl: '/a' }
  );

  // Preload a sibling into the stack's inactive tail. The stack index stays at 0.
  act(() => router.prefetch('/b'));

  // NOTE: the old pre-branch behavior returned `true` here (it checked `routes.length > 1`,
  // which counted the preloaded tail). Returning `false` is an intentional fix — a preloaded,
  // inactive route is not something a POP can dismiss.
  expect(router.canDismiss()).toBe(false);
  expect(expectDismissMatchesCanDismiss()).toBe(false);
});
