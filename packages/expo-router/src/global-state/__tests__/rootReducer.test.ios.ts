import {
  asFocusChildAction,
  focusChild,
  TabActions,
  TabRouter,
  type NavigationAction,
  type NavigationState,
} from '../../react-navigation/routers';
import { createReducerRegistry } from '../storeContext';
import { rootReducer } from '../rootReducer';

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

  it('returns ordered changed slices for centralized beforeRemove checks', () => {
    const registry = createReducerRegistry();
    const action: NavigationAction = { type: 'JUMP_TO', target: 'home-state' };
    const childState = rootState.routes[0]!.state as NavigationState;
    const nextChildState = { ...childState, index: 1 };
    const entry = { reduce: jest.fn(() => nextChildState) };

    registry.addEntry('home-state', entry);

    const result = rootReducer(rootState, action, registry);

    expect(result.changedSlices).toEqual([
      {
        key: 'home-state',
        previousState: childState,
        nextState: nextChildState,
        entry,
      },
    ]);
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
