import {
  asFocusChildAction,
  focusChild,
  TabActions,
  TabRouter,
  type NavigationAction,
  type NavigationState,
} from '../../react-navigation/routers';
import { createReducerRegistry } from '../storeContext';
import { type RootReducerEnvelope, reduceRootNavigation, rootReducer } from '../rootReducer';

const rootState: NavigationState = {
  stale: false,
  key: 'root-state',
  index: 0,
  routeNames: ['home', 'settings'],
  routes: [
    {
      key: 'home-route',
      name: 'home',
      state: {
        stale: false,
        key: 'home-state',
        index: 0,
        routeNames: ['feed', 'details'],
        routes: [
          { key: 'feed-route', name: 'feed' },
          { key: 'details-route', name: 'details' },
        ],
      },
    },
    { key: 'settings-route', name: 'settings' },
  ],
};

function registerNullReducers(registry = createReducerRegistry()) {
  registry.addEntry('root-state', { reduce: jest.fn(() => null) });
  registry.addEntry('home-state', { reduce: jest.fn(() => null) });

  return registry;
}

describe(rootReducer, () => {
  it('reduces a targeted child slice and splices it back into the root tree', () => {
    const registry = registerNullReducers();
    const action: NavigationAction = { type: 'JUMP_TO', target: 'home-state' };
    const childState = rootState.routes[0]!.state as NavigationState;
    const nextChildState = { ...childState, index: 1 };
    const reduce = jest.fn(() => nextChildState);

    registry.addEntry('home-state', { reduce });

    const result = rootReducer(rootState, action, registry);

    expect(result).toMatchObject({ state: expect.any(Object), handled: true, noop: false });
    expect(reduce).toHaveBeenCalledWith(childState, action);
    expect(result.state.routes[0]!.state).toBe(nextChildState);
    expect(result.state.routes[1]).toBe(rootState.routes[1]);
    expect(result.state).not.toBe(rootState);
  });

  it('retries GO_BACK on ancestors when the targeted child cannot handle it', () => {
    const registry = createReducerRegistry();
    const action: NavigationAction = { type: 'GO_BACK' };
    const rootReduced = { ...rootState, index: 1 };
    const childReduce = jest.fn(() => null);
    const rootReduce = jest.fn(() => rootReduced);

    registry.addEntry('root-state', { reduce: rootReduce });
    registry.addEntry('home-state', { reduce: childReduce });

    const result = rootReducer(rootState, action, registry, { originKey: 'home-state' });

    expect(childReduce).toHaveBeenCalledTimes(1);
    expect(rootReduce).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ state: rootReduced, handled: true, noop: false });
  });

  it('treats explicitly targeted null reductions as handled no-ops', () => {
    const registry = createReducerRegistry();
    const action: NavigationAction = { type: 'GO_BACK', target: 'home-state' };
    const childReduce = jest.fn(() => null);
    const rootReduce = jest.fn(() => ({ ...rootState, index: 1 }));

    registry.addEntry('root-state', { reduce: rootReduce });
    registry.addEntry('home-state', { reduce: childReduce });

    const result = rootReducer(rootState, action, registry);

    expect(result).toMatchObject({ state: rootState, handled: true, noop: true });
    expect(rootReduce).not.toHaveBeenCalled();
  });

  it('inserts payload.state at the first unmounted boundary', () => {
    const registry = createReducerRegistry();
    const payloadState: NavigationState = {
      stale: false,
      key: 'settings-child-state',
      index: 0,
      routeNames: ['profile'],
      routes: [{ key: 'profile-route', name: 'profile' }],
    };
    const action: NavigationAction = {
      type: 'NAVIGATE',
      target: 'root-state',
      payload: { name: 'settings', state: payloadState },
    };
    const reducedRoot = { ...rootState, index: 1 };

    registry.addEntry('root-state', { reduce: jest.fn(() => reducedRoot) });

    const result = rootReducer(rootState, action, registry);

    expect(result.handled).toBe(true);
    expect(result.state.routes[1]!.state).toBe(payloadState);
    expect(reducedRoot.routes[1]!.state).toBeUndefined();
  });

  it('inserts PRELOAD payload.state on the preloaded route instead of the focused route', () => {
    const registry = createReducerRegistry();
    const payloadState: NavigationState = {
      stale: false,
      key: 'settings-route',
      index: 0,
      routeNames: ['profile'],
      routes: [{ key: 'profile-route', name: 'profile' }],
    };
    const action: NavigationAction = {
      type: 'PRELOAD',
      target: 'root-state',
      payload: { name: 'settings', state: payloadState },
    };
    const reducedRoot: NavigationState = {
      ...rootState,
      routes: [
        rootState.routes[0]!,
        {
          key: 'settings-route',
          name: 'settings',
        },
      ],
    };

    registry.addEntry('root-state', { reduce: jest.fn(() => reducedRoot) });
    registry.addEntry('home-state', { reduce: jest.fn(() => rootState.routes[0]!.state!) });

    const result = rootReducer(rootState, action, registry);

    expect(result.handled).toBe(true);
    expect(result.state.routes[0]!.state).toBe(rootState.routes[0]!.state);
    expect(result.state.routes[1]!.state).toBe(payloadState);
  });

  it('does not overwrite an existing child state with payload.state', () => {
    const registry = createReducerRegistry();
    const payloadState: NavigationState = {
      stale: false,
      key: 'ignored-state',
      index: 0,
      routeNames: ['ignored'],
      routes: [{ key: 'ignored-route', name: 'ignored' }],
    };
    const action: NavigationAction = {
      type: 'NAVIGATE',
      target: 'root-state',
      payload: { name: 'home', state: payloadState },
    };

    registry.addEntry('root-state', { reduce: jest.fn((state, action) => (asFocusChildAction(action) ? state : rootState)) });
    registry.addEntry('home-state', { reduce: jest.fn(() => rootState.routes[0]!.state!) });

    const result = rootReducer(rootState, action, registry);

    expect(result.state.routes[0]!.state).toBe(rootState.routes[0]!.state);
  });

  it('inserts payload.state at a deeper unmounted boundary after descending through live children', () => {
    const registry = createReducerRegistry();
    const payloadState: NavigationState = {
      stale: false,
      key: 'details-child-state',
      index: 0,
      routeNames: ['comments'],
      routes: [{ key: 'comments-route', name: 'comments' }],
    };
    const action: NavigationAction = {
      type: 'NAVIGATE',
      target: 'root-state',
      payload: { name: 'home', state: payloadState },
    };
    const childState = rootState.routes[0]!.state as NavigationState;
    const focusedChild = { ...childState, index: 1 };

    registry.addEntry('root-state', { reduce: jest.fn((state, action) => (asFocusChildAction(action) ? state : rootState)) });
    registry.addEntry('home-state', { reduce: jest.fn(() => focusedChild) });

    const result = rootReducer(rootState, action, registry);
    const nextChildState = result.state.routes[0]!.state as NavigationState;

    expect(nextChildState.routes[1]!.state).toBe(payloadState);
    expect(childState.routes[1]!.state).toBeUndefined();
  });

  it('runs a targeted tab JUMP_TO through the registered tab router', () => {
    const tabState: NavigationState = {
      stale: false,
      key: 'tabs-state',
      index: 0,
      routeNames: ['feed', 'profile'],
      routes: [
        { key: 'feed-route', name: 'feed' },
        { key: 'profile-route', name: 'profile' },
      ],
    };
    const tree: NavigationState = {
      ...rootState,
      routes: [{ ...rootState.routes[0]!, state: tabState }, rootState.routes[1]!],
    };
    const router = TabRouter({ backBehavior: 'order' });
    const registry = createReducerRegistry();
    const action = { ...TabActions.jumpTo('profile'), target: 'tabs-state' };

    registry.addEntry('tabs-state', {
      reduce: (state, action) =>
        router.getStateForAction(state, action as Parameters<typeof router.getStateForAction>[1], {
          routeNames: ['feed', 'profile'],
          parentRouteKey: 'home-route',
          routeParamList: {},
          routeGetIdList: {},
        }),
    });

    const result = rootReducer(tree, action, registry);

    expect(result.handled).toBe(true);
    expect((result.state.routes[0]!.state as NavigationState).index).toBe(1);
    expect(result.state.routes[1]).toBe(tree.routes[1]);
  });

  it('focuses ancestor routes after a focus-changing child reduction', () => {
    const tree: NavigationState = {
      ...rootState,
      index: 1,
      routes: [
        rootState.routes[0]!,
        {
          ...rootState.routes[1]!,
          state: {
            stale: false,
            key: 'settings-state',
            index: 0,
            routeNames: ['profile'],
            routes: [{ key: 'profile-route', name: 'profile' }],
          },
        },
      ],
    };
    const action: NavigationAction = { type: 'NAVIGATE', target: 'home-state' };
    const childState = tree.routes[0]!.state as NavigationState;
    const nextChildState = { ...childState, index: 1 };
    const registry = createReducerRegistry();
    // Ancestor refocus is now a FOCUS_CHILD reduction: the root focuses the child route it carries.
    const reduceRoot = jest.fn((state: NavigationState, reduceAction: NavigationAction) =>
      asFocusChildAction(reduceAction) ? { ...state, index: 0 } : null
    );

    registry.addEntry('root-state', { reduce: reduceRoot });
    registry.addEntry('home-state', {
      reduce: jest.fn(() => nextChildState),
    });

    const result = rootReducer(tree, action, registry);

    expect(reduceRoot).toHaveBeenCalledWith(expect.any(Object), focusChild('home-route'));
    expect(result.state.index).toBe(0);
    expect(result.state.routes[0]!.state).toBe(nextChildState);
  });

  it('returns the original tree for unhandled actions', () => {
    const registry = registerNullReducers();
    const action: NavigationAction = { type: 'UNKNOWN' };

    const result = rootReducer(rootState, action, registry, { originKey: 'home-state' });

    expect(result).toMatchObject({ state: rootState, handled: false, noop: true });
  });

  it('returns the original tree when the target is missing or unregistered', () => {
    const registry = createReducerRegistry();

    expect(rootReducer(rootState, { type: 'UNKNOWN', target: 'missing' }, registry)).toMatchObject({
      state: rootState,
      handled: false,
      noop: true,
    });

    expect(
      rootReducer(rootState, { type: 'UNKNOWN', target: 'home-state' }, registry)
    ).toMatchObject({
      state: rootState,
      handled: false,
      noop: true,
    });
  });

  it('returns handled noop when a reducer returns the same state object', () => {
    const registry = createReducerRegistry();

    registry.addEntry('home-state', { reduce: jest.fn(() => rootState.routes[0]!.state!) });

    expect(
      rootReducer(rootState, { type: 'UNKNOWN', target: 'home-state' }, registry)
    ).toMatchObject({
      state: rootState,
      handled: true,
      noop: true,
    });
  });

  it('returns the identical root reference on a nested no-op (does not rebuild ancestors)', () => {
    const registry = createReducerRegistry();

    // A nested (non-root) target whose reducer returns its slice unchanged: the reduction is a
    // genuine no-op, so the whole tree — including every ancestor `replacePathState` walks through —
    // must come back referentially identical. Referential identity (not `toMatchObject`) is what
    // `canGoBack`/`canDismiss` rely on post-flip (`reduceRoot(...).state === committed`).
    registry.addEntry('home-state', { reduce: jest.fn(() => rootState.routes[0]!.state!) });

    const result = rootReducer(rootState, { type: 'UNKNOWN', target: 'home-state' }, registry);

    expect(result.noop).toBe(true);
    expect(result.state).toBe(rootState);
  });

  it('does not revisit an ancestor after a focused child cannot handle the action', () => {
    const registry = createReducerRegistry();
    const action: NavigationAction = {
      type: 'SET_PARAMS',
      source: 'home-route',
      payload: { params: { username: 'alice' } },
    };
    const rootReduce = jest.fn(() => ({
      ...rootState,
      routes: [
        { ...rootState.routes[0]!, params: { username: 'alice' } },
        rootState.routes[1]!,
      ],
    }));
    const childReduce = jest.fn(() => null);

    registry.addEntry('root-state', { reduce: rootReduce });
    registry.addEntry('home-state', { reduce: childReduce });

    const result = rootReducer(rootState, action, registry);

    expect(result).toMatchObject({ handled: true, noop: false });
    expect(rootReduce).toHaveBeenCalledTimes(1);
    expect(childReduce).toHaveBeenCalledTimes(1);
    expect(result.state.routes[0]!.params).toEqual({ username: 'alice' });
  });

  it('records a deferred nested action when the focused child is not yet registered', () => {
    const registry = createReducerRegistry();
    const params = { screen: 'profile', params: { id: 7 } };
    const action: NavigationAction = {
      type: 'NAVIGATE',
      target: 'root-state',
      payload: { name: 'settings', params },
    };
    const reducedRoot: NavigationState = {
      ...rootState,
      index: 1,
      routes: [rootState.routes[0]!, { ...rootState.routes[1]!, params }],
    };

    registry.addEntry('root-state', { reduce: jest.fn(() => reducedRoot) });

    const result = rootReducer(rootState, action, registry);

    expect(result.handled).toBe(true);
    expect(result.nestedBoundary).toEqual({
      type: 'deferred',
      parentRouteKey: 'settings-route',
      childStateKey: undefined,
      action: {
        type: 'NAVIGATE',
        payload: { name: 'profile', params: { id: 7 }, path: undefined, merge: undefined, pop: undefined },
      },
      routeParams: params,
    });
  });

  it('records a rejected nested action when a registered child cannot handle it', () => {
    const registry = createReducerRegistry();
    const action: NavigationAction = {
      type: 'NAVIGATE',
      target: 'root-state',
      payload: { name: 'home', params: { screen: 'invalid' } },
    };

    registry.addEntry('root-state', { reduce: jest.fn((state, action) => (asFocusChildAction(action) ? state : rootState)) });
    registry.addEntry('home-state', {
      reduce: jest.fn((state, nested) => (nested.type === 'NAVIGATE' ? null : state)),
    });

    const result = rootReducer(rootState, action, registry);

    expect(result.handled).toBe(true);
    expect(result.nestedBoundary).toEqual({
      type: 'rejected',
      parentRouteKey: 'home-route',
      action: {
        type: 'NAVIGATE',
        payload: { name: 'invalid', params: undefined, path: undefined, merge: undefined, pop: undefined },
      },
    });
  });

  it('leaves no nested boundary when a registered child consumes the nested action', () => {
    const registry = createReducerRegistry();
    const action: NavigationAction = {
      type: 'NAVIGATE',
      target: 'root-state',
      payload: { name: 'home', params: { screen: 'details' } },
    };
    const childState = rootState.routes[0]!.state as NavigationState;

    registry.addEntry('root-state', { reduce: jest.fn((state, action) => (asFocusChildAction(action) ? state : rootState)) });
    registry.addEntry('home-state', {
      reduce: jest.fn((state, nested) => (nested.type === 'NAVIGATE' ? { ...state, index: 1 } : state)),
    });

    const result = rootReducer(rootState, action, registry);

    expect(result.handled).toBe(true);
    expect(result.nestedBoundary).toBeUndefined();
    expect((result.state.routes[0]!.state as NavigationState).index).toBe(1);
    expect(childState.index).toBe(0);
  });

  it('path-copies without cloning untouched non-serializable params', () => {
    const callback = () => undefined;
    const tree: NavigationState = {
      ...rootState,
      routes: [
        {
          ...rootState.routes[0]!,
          state: {
            ...(rootState.routes[0]!.state as NavigationState),
            routes: [{ key: 'feed-route', name: 'feed', params: { callback } }],
          },
        },
        rootState.routes[1]!,
      ],
    };
    const childState = tree.routes[0]!.state as NavigationState;
    const nextChildState = { ...childState, index: 0 };
    const registry = createReducerRegistry();

    Object.freeze(tree);
    Object.freeze(tree.routes);
    Object.freeze(childState);

    registry.addEntry('home-state', { reduce: jest.fn(() => nextChildState) });

    const result = rootReducer(tree, { type: 'SET_PARAMS', target: 'home-state' }, registry);

    expect(result.state.routes[0]!.state).toBe(nextChildState);
    expect(result.state.routes[1]).toBe(tree.routes[1]);
    expect(result.state.routes[1]).toBe(tree.routes[1]);
    expect((tree.routes[0]!.state as NavigationState).routes[0]!.params).toBe(
      childState.routes[0]!.params
    );
    expect((tree.routes[0]!.state as NavigationState).routes[0]!.params).toEqual({ callback });
  });

});

// State-carried mount-window replay (the `pendingActions` field on the root `useReducer` state).
// Source-gated deferrability (D5): a JS-initiated action whose origin navigator isn't registered yet
// is queued for replay; an urgent (native-induced) action with the same shape is NEVER queued; a
// replay that still can't reduce is dropped (drop-after-one-retry), not re-queued.
describe('reduceRootNavigation pendingActions (source-gated mount-window replay)', () => {
  // An untargeted action whose declared origin navigator has no registered reducer — the mount window.
  const untargetedAction: NavigationAction = { type: 'GO_BACK' };
  const seed = () => ({ tree: rootState, pendingActions: [] });

  it('queues a JS-initiated untargeted action whose origin is not yet registered', () => {
    const registry = createReducerRegistry(); // nothing registered → origin unregistered
    const envelope: RootReducerEnvelope = {
      action: untargetedAction,
      originKey: 'unregistered-navigator',
    };

    const next = reduceRootNavigation(seed(), envelope, registry);

    expect(next.pendingActions).toHaveLength(1);
    expect(next.pendingActions[0]!.action).toBe(untargetedAction);
    expect(next.tree).toBe(rootState);
  });

  it('never queues an urgent (native-induced) action, even untargeted with an unregistered origin', () => {
    const registry = createReducerRegistry();
    const envelope: RootReducerEnvelope = {
      action: untargetedAction,
      originKey: 'unregistered-navigator',
      urgent: true,
    };

    const next = reduceRootNavigation(seed(), envelope, registry);

    // Source-gated: the native fact is already committed on the native side; its JS echo is never
    // deferred/replayed. It reduces to a no-op here (unhandled), leaving the queue empty.
    expect(next.pendingActions).toHaveLength(0);
  });

  it('is idempotent under repeated reduction of the same action object (React double-invoke)', () => {
    const registry = createReducerRegistry();
    const envelope: RootReducerEnvelope = {
      action: untargetedAction,
      originKey: 'unregistered-navigator',
    };

    const once = reduceRootNavigation(seed(), envelope, registry);
    // Reduce the SAME envelope again against the already-queued state (React invokes the reducer
    // eagerly at dispatch and again at render): the identity-keyed append must not double-queue.
    const twice = reduceRootNavigation(once, envelope, registry);

    expect(twice.pendingActions).toHaveLength(1);
  });

  it('drops a replay-marked action that still cannot reduce (drop-after-one-retry)', () => {
    const registry = createReducerRegistry();
    const queued = reduceRootNavigation(
      seed(),
      { action: untargetedAction, originKey: 'unregistered-navigator' },
      registry
    );
    expect(queued.pendingActions).toHaveLength(1);

    // The container's replay effect re-dispatches the SAME action object urgently with `isReplay`;
    // the origin is still unregistered, so it drops rather than re-queues — the entry (keyed by the
    // action's identity, which the reducer recomputes) leaves the queue.
    const replayed = reduceRootNavigation(
      queued,
      { action: untargetedAction, originKey: 'unregistered-navigator', isReplay: true, urgent: true },
      registry
    );

    expect(replayed.pendingActions).toHaveLength(0);
  });
});

// Monotonic navigation-id accounting (D3, Step 8). Every id-bearing envelope records its id into
// committed `lastReduced` on EVERY reduce path (applied / noop / append / drop / supersede), so the
// global pending indicator (`pending = lastIssued > lastReduced`, derived in the container) always
// un-wedges. Id-less (urgent-native) envelopes never touch the field. Staleness (supersede-to-noop)
// is the pure READ predicate `navId < lastReduced`; the mid-flight WRITE trigger is simulator-only
// (Step 9). These are pure-reducer properties — no mid-flight window needed.
describe('reduceRootNavigation navId accounting (D3 pending signal)', () => {
  const seed = (lastReduced?: number) => ({ tree: rootState, pendingActions: [], lastReduced });

  // A registered reducer that genuinely changes its slice, so the reduction is "applied".
  function registerChangingHome(registry = createReducerRegistry()) {
    const childState = rootState.routes[0]!.state as NavigationState;
    registry.addEntry('home-state', { reduce: jest.fn(() => ({ ...childState, index: 1 })) });
    return registry;
  }

  // A registered reducer that returns its slice unchanged, so the reduction is a handled no-op.
  function registerNoopHome(registry = createReducerRegistry()) {
    registry.addEntry('home-state', { reduce: jest.fn(() => rootState.routes[0]!.state!) });
    return registry;
  }

  it('records the id when an action applies a real change', () => {
    const registry = registerChangingHome();
    const envelope: RootReducerEnvelope = {
      action: { type: 'JUMP_TO', target: 'home-state' },
      navId: 3,
    };

    const next = reduceRootNavigation(seed(), envelope, registry);

    expect(next.tree).not.toBe(rootState);
    expect(next.lastReduced).toBe(3);
  });

  it('does NOT record when an envelope carries no id (urgent-native path)', () => {
    // Falsifiability partner to the above: an id-less envelope reduces normally but must leave
    // `lastReduced` untouched — a native gesture must not advance the JS pending accounting (D3).
    const registry = registerChangingHome();
    const envelope: RootReducerEnvelope = {
      action: { type: 'JUMP_TO', target: 'home-state' },
      urgent: true,
    };

    const next = reduceRootNavigation(seed(7), envelope, registry);

    expect(next.lastReduced).toBe(7);
  });

  it('records the id on a handled no-op and returns the identical tree reference', () => {
    // The tree half stays referentially identical (Step-5 noop-identity guarantee — `canGoBack`
    // depends on it); the `lastReduced` half forces a NEW state object so React's identical-state
    // bailout does not swallow the commit that carries the id catch-up.
    const registry = registerNoopHome();
    const envelope: RootReducerEnvelope = {
      action: { type: 'UNKNOWN', target: 'home-state' },
      navId: 4,
    };

    const next = reduceRootNavigation(seed(), envelope, registry);

    expect(next.tree).toBe(rootState);
    expect(next.lastReduced).toBe(4);
    expect(next).not.toBe(rootState);
  });

  it('records the id both when appending to pendingActions and when the replay drops it', () => {
    const registry = createReducerRegistry(); // origin unregistered → mount-window queue
    const action: NavigationAction = { type: 'GO_BACK' };

    const queued = reduceRootNavigation(
      seed(),
      { action, originKey: 'unregistered-navigator', navId: 8 },
      registry
    );
    expect(queued.pendingActions).toHaveLength(1);
    expect(queued.lastReduced).toBe(8);

    const dropped = reduceRootNavigation(
      queued,
      { action, originKey: 'unregistered-navigator', isReplay: true, urgent: true, navId: 8 },
      registry
    );
    expect(dropped.pendingActions).toHaveLength(0);
    expect(dropped.lastReduced).toBe(8);
  });

  it('takes the max — a lower id arriving after a higher one does not lower lastReduced', () => {
    const registry = registerChangingHome();

    const next = reduceRootNavigation(
      seed(5),
      { action: { type: 'JUMP_TO', target: 'home-state' }, navId: 2 },
      registry
    );

    expect(next.lastReduced).toBe(5);
  });

  it('records the id on a ROUTER_LINK that cannot resolve yet (config absent) so a pre-ready push does not wedge', () => {
    // The `config == null` early return (a `ROUTER_LINK` dispatched before the container's linking
    // config is ready) reduces to a no-op — but must still record the id, or the indicator wedges at
    // pending forever. The `resolved == null` early return (redirect-consumed / uncompilable path)
    // shares the identical `withNavId(state)` return.
    const registry = createReducerRegistry();
    const envelope: RootReducerEnvelope = {
      action: { type: 'ROUTER_LINK', payload: { href: '/x', options: {} } } as any,
      navId: 9,
      // config omitted → the reducer's `config == null` branch
    };

    const next = reduceRootNavigation(seed(), envelope, registry);

    expect(next.tree).toBe(rootState);
    expect(next.lastReduced).toBe(9);
  });

  it('supersede READ predicate: a stale (navId < lastReduced) transition reduces to a recorded no-op', () => {
    // A higher-id navigation already reduced past this one (committed `lastReduced = 5`). React
    // cannot dequeue the pending update, so this stale action re-reduces — the reducer recognizes
    // `navId < lastReduced` and returns the identical tree while recording (max keeps 5). This is the
    // jest-able READ half; the mid-flight WRITE (real abandonment) is simulator-only (Step 9).
    const registry = registerChangingHome();
    const envelope: RootReducerEnvelope = {
      action: { type: 'JUMP_TO', target: 'home-state' },
      navId: 4,
    };

    const next = reduceRootNavigation(seed(5), envelope, registry);

    expect(next.tree).toBe(rootState);
    expect(next.lastReduced).toBe(5);
  });

  it('supersede falsifiability sibling: a fresh (navId > lastReduced) transition applies normally', () => {
    const registry = registerChangingHome();
    const envelope: RootReducerEnvelope = {
      action: { type: 'JUMP_TO', target: 'home-state' },
      navId: 6,
    };

    const next = reduceRootNavigation(seed(5), envelope, registry);

    expect(next.tree).not.toBe(rootState);
    expect(next.lastReduced).toBe(6);
  });

  it('anti-wedge: after a stale action is superseded, the pending predicate resolves false', () => {
    // The correctness property the whole mechanism exists for: a superseded/stale navigation must
    // not wedge `pending` at true forever. Issue id 6 (applies), then a stale id 4 re-reduces
    // (supersede no-op). `lastReduced` reaches 6, so with `lastIssued = 6` the derived
    // `pending = lastIssued > lastReduced` is false.
    const registry = registerChangingHome();

    const applied = reduceRootNavigation(
      seed(),
      { action: { type: 'JUMP_TO', target: 'home-state' }, navId: 6 },
      registry
    );
    const afterStale = reduceRootNavigation(
      applied,
      { action: { type: 'JUMP_TO', target: 'home-state' }, navId: 4 },
      registry
    );

    const lastIssued = 6;
    expect(lastIssued > (afterStale.lastReduced ?? 0)).toBe(false);
  });

  it('anti-wedge sibling: an in-flight id (lastIssued > lastReduced) reports pending true', () => {
    const registry = registerChangingHome();

    const reduced = reduceRootNavigation(
      seed(),
      { action: { type: 'JUMP_TO', target: 'home-state' }, navId: 3 },
      registry
    );

    const lastIssued = 4; // a later navigation was issued but has not reduced yet
    expect(lastIssued > (reduced.lastReduced ?? 0)).toBe(true);
  });
});
