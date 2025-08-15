/**
 * This spec verifies the core logic that modal routes are excluded from the
 * "normal" stack on the web platform.  It purposely avoids `renderRouter`
 * (which depends on react-native-test-renderer) and instead exercises the same
 * predicate used inside `ModalStackView`.
 */

import { StackNavigationState } from '@react-navigation/native';

import { convertStackStateToNonModalState } from '../modal/web/utils';

describe('modal route filtering on web', () => {
  const ORIGINAL_OS = process.env.EXPO_OS;

  afterEach(() => {
    process.env.EXPO_OS = ORIGINAL_OS; // restore
  });

  function makeState(routeKeys: string[], index: number = 0): StackNavigationState<any> {
    return {
      index,
      routes: routeKeys.map((key) => ({ key, name: key })),
      stale: false,
      key: 'stack-1',
      routeNames: routeKeys,
    } as any;
  }

  it('excludes modal routes when EXPO_OS === "web"', () => {
    process.env.EXPO_OS = 'web';

    const state = makeState(['index', 'second']);
    const descriptors: any = {
      index: { options: {} },
      second: { options: { presentation: 'modal' } },
    };

    const { routes } = convertStackStateToNonModalState(state, descriptors, true);
    expect(routes.map((r) => r.key)).toEqual(['index']);
  });

  it('recalculates stack index after filtering out modal routes', () => {
    process.env.EXPO_OS = 'web';

    const state = makeState(['index', 'page1', 'modal1', 'page2'], 3);

    const descriptors: any = {
      index: { options: {} },
      page1: { options: {} },
      modal1: { options: { presentation: 'modal' } },
      page2: { options: {} },
    };

    const { routes, index } = convertStackStateToNonModalState(state, descriptors, true);
    expect(routes.map((r) => r.key)).toEqual(['index', 'page1', 'page2']);
    expect(index).toBe(2);
  });

  it('falls back to last non-modal route when current route is modal', () => {
    process.env.EXPO_OS = 'web';

    const state = makeState(['index', 'modal1'], 1);

    const descriptors: any = {
      index: { options: {} },
      modal1: { options: { presentation: 'modal' } },
    };

    const { routes, index } = convertStackStateToNonModalState(state, descriptors, true);
    expect(routes.map((r) => r.key)).toEqual(['index']);
    expect(index).toBe(0);
  });

  // We purposefully avoid asserting native behaviour here because in the Jest
  // web / node projects the Babel transform inlines `process.env.EXPO_OS` as
  // "web" at compile-time, so runtime mutation wouldn't reflect in the code
  // under test.
});
