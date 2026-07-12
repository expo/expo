import type { InternalRouter, NavigationState, ParamListBase } from '../../react-navigation/routers';

// Shared recorder for the router "repair" methods that rebuild a navigator's slice at render time.
//
// Spy mechanism: each test file `jest.mock`s the leaf router modules
// (`react-navigation/routers/StackRouter`, `.../TabRouter`, `.../DrawerRouter`) and replaces the
// exported factory (e.g. `StackRouter`) with `wrapRouterFactory('Stack', actual.StackRouter)`.
// Every navigator ultimately imports these factories through the `native` -> `core` -> `routers`
// barrel chain, so wrapping the leaf module intercepts every navigator in the tree. The wrapper
// delegates to the real router and records each call, so we observe exactly what
// `useNavigationBuilder` invokes on mount without touching production code.
//
// Step 3 goal these guard: the compiled `getStateFromPath` state seeds the container verbatim, so on
// a deep-link startup `getRehydratedState` must behave as identity (output deep-equals input) rather
// than re-minting `stack-/tab-<nanoid>` keys, and `getStateForRouteNamesChange` must never fire.

type AnyRouterState = NavigationState<ParamListBase>;
// The concrete router options/actions differ per navigator; the wrapper is agnostic to them.
type AnyRouter = InternalRouter<AnyRouterState, { type: string }>;
type AnyRouterFactory = (options: never) => AnyRouter;

export type MethodCall = {
  router: string;
  input: unknown;
  output: unknown;
};

export const routerSpyCalls = {
  getInitialState: [] as MethodCall[],
  getRehydratedState: [] as MethodCall[],
  getStateForRouteNamesChange: [] as MethodCall[],
};

export function resetRouterSpies() {
  routerSpyCalls.getInitialState.length = 0;
  routerSpyCalls.getRehydratedState.length = 0;
  routerSpyCalls.getStateForRouteNamesChange.length = 0;
}

export function wrapRouterFactory<F extends AnyRouterFactory>(name: string, factory: F): F {
  return ((options: never) => {
    const router = factory(options);

    return {
      ...router,
      getInitialState(...args: Parameters<AnyRouter['getInitialState']>) {
        const output = router.getInitialState(...args);
        routerSpyCalls.getInitialState.push({ router: name, input: args[0], output });
        return output;
      },
      getRehydratedState(...args: Parameters<AnyRouter['getRehydratedState']>) {
        const output = router.getRehydratedState(...args);
        routerSpyCalls.getRehydratedState.push({ router: name, input: args[0], output });
        return output;
      },
      getStateForRouteNamesChange(
        ...args: Parameters<AnyRouter['getStateForRouteNamesChange']>
      ) {
        const output = router.getStateForRouteNamesChange(...args);
        routerSpyCalls.getStateForRouteNamesChange.push({ router: name, input: args[0], output });
        return output;
      },
    };
  }) as F;
}
