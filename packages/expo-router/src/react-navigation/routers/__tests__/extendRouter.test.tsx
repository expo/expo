import { expect, jest, test } from '@jest/globals';

import {
  extendRouter,
  extendRouterActions,
  extendStackRouter,
  extendTabRouter,
} from '../extendRouter';
import type {
  DefaultRouterOptions,
  NavigationState,
  Router,
  RouterActionResult,
  RouterConfigOptions,
} from '../types';

type TestState = NavigationState & { type?: 'test' };
type TestAction = { type: 'BASE'; payload?: object };
type CustomAction = {
  type: 'CUSTOM';
  payload: { value: number };
};
type TestRouterOptions = DefaultRouterOptions & { enabled?: boolean };

const state: TestState = {
  stale: false,
  type: 'test',
  key: 'test:root',
  routeKeySeq: 0,
  index: 0,
  routeNames: ['index'],
  routes: [{ key: 'index:0', name: 'index' }],
};

function createTestRouter() {
  let router: Router<TestState, TestAction> | undefined;
  const factory = jest.fn((_options: TestRouterOptions): Router<TestState, TestAction> => {
    const createdRouter: Router<TestState, TestAction> = {
      type: 'test',
      getStateForDeclaredRoutes: jest.fn((state: TestState) => state),
      getStateForRouteFocus: jest.fn((state: TestState) => state),
      getStateForAction: jest.fn(() => ({
        state,
        affectedRouteKey: state.routes[state.index]?.key,
      })),
      shouldActionChangeFocus: jest.fn(() => false),
      actionCreators: {
        reset: () => ({ type: 'BASE' }),
      },
    };
    router = createdRouter;
    return createdRouter;
  });

  return { factory, getRouter: () => router! };
}

test('extends a complete router implementation', () => {
  const { factory, getRouter } = createTestRouter();
  const getStateForRouteFocus = jest.fn((state: TestState) => state);
  const extension = jest.fn(() => ({ getStateForRouteFocus }));
  const extendedFactory = extendRouter(factory, extension);

  const extended = extendedFactory({
    initialRouteName: 'index',
    enabled: true,
  });
  const original = getRouter();

  expect(factory).toHaveBeenCalledWith({
    initialRouteName: 'index',
    enabled: true,
  });
  expect(extension).toHaveBeenCalledWith(original, {
    initialRouteName: 'index',
    enabled: true,
  });
  expect(extended.getStateForRouteFocus).toBe(getStateForRouteFocus);
  expect(extended.getStateForDeclaredRoutes).toBe(original.getStateForDeclaredRoutes);
  expect(extended.getStateForAction).toBe(original.getStateForAction);
  expect(extended.shouldActionChangeFocus).toBe(original.shouldActionChangeFocus);
  expect(extended.actionCreators).toBe(original.actionCreators);
});

test('extends only action handling and preserves the other router members', () => {
  const { factory, getRouter } = createTestRouter();
  const expected: RouterActionResult<TestState> = {
    state: { ...state, index: 0 },
    affectedRouteKey: 'custom',
  };
  const handleAction = jest.fn(
    (
      _state: TestState,
      action: TestAction | CustomAction,
      _options: RouterConfigOptions,
      result: RouterActionResult<TestState> | null,
      _routerOptions: TestRouterOptions
    ) => (action.type === 'CUSTOM' ? expected : result)
  );
  const extended = extendRouterActions<TestState, TestAction, CustomAction, TestRouterOptions>(
    factory,
    handleAction
  )({ enabled: true });
  const original = getRouter();
  const options = { routeNames: ['index'], routeGetIdList: {} };
  const action: CustomAction = { type: 'CUSTOM', payload: { value: 1 } };

  expect(extended.getStateForAction(state, action, options)).toBe(expected);
  expect(original.getStateForAction).toHaveBeenCalledTimes(1);
  expect(original.getStateForAction).toHaveBeenCalledWith(state, action, options);
  expect(handleAction).toHaveBeenCalledWith(
    state,
    action,
    options,
    expect.objectContaining({ affectedRouteKey: 'index:0' }),
    { enabled: true }
  );
  expect(extended.getStateForDeclaredRoutes).toBe(original.getStateForDeclaredRoutes);
  expect(extended.getStateForRouteFocus).toBe(original.getStateForRouteFocus);
  expect(extended.shouldActionChangeFocus).toBe(original.shouldActionChangeFocus);
  expect(extended.actionCreators).toBe(original.actionCreators);
});

test('allows an action extension to preserve null from the original router', () => {
  const { factory, getRouter } = createTestRouter();
  const extendedFactory = extendRouterActions<
    TestState,
    TestAction,
    CustomAction,
    TestRouterOptions
  >(factory, (_state, _action, _options, result) => result);
  const extended = extendedFactory({});
  const original = getRouter();
  jest.mocked(original.getStateForAction).mockReturnValueOnce(null);

  expect(
    extended.getStateForAction(state, { type: 'BASE' }, { routeNames: [], routeGetIdList: {} })
  ).toBeNull();
});

test('provides stack and tab router extension shortcuts', () => {
  expect(
    extendStackRouter(() => ({ shouldActionChangeFocus: () => true }))({}).shouldActionChangeFocus({
      type: 'CUSTOM',
    })
  ).toBe(true);
  expect(
    extendTabRouter(() => ({ shouldActionChangeFocus: () => true }))({}).shouldActionChangeFocus({
      type: 'CUSTOM',
    })
  ).toBe(true);
});

const customActionRouter = extendRouterActions<
  TestState,
  TestAction,
  CustomAction,
  TestRouterOptions
>(
  () => createTestRouter().factory({}),
  (state, action, _options, result) => {
    if (action.type === 'CUSTOM') {
      action.payload.value satisfies number;
      return { state, affectedRouteKey: undefined };
    }
    return result;
  }
);

customActionRouter({ enabled: true }).getStateForAction(
  state,
  { type: 'CUSTOM', payload: { value: 1 } },
  { routeNames: [], routeGetIdList: {} }
);

customActionRouter({}).getStateForAction(
  state,
  // @ts-expect-error Custom action payload is checked by the extended router factory.
  { type: 'CUSTOM', payload: { value: 'invalid' } },
  {
    routeNames: [],
    routeGetIdList: {},
  }
);
