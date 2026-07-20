import {
  asReconcileRouteNamesAction,
  type NavigationState,
  type ParamListBase,
  type Router,
} from '../../react-navigation/routers';

// Shared recorder for the router state-seeding paths that rebuild a navigator's slice at render time.
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
// a deep-link startup no route-names reconciliation fires — the `RECONCILE_ROUTE_NAMES` case of
// `getStateForAction` (which absorbed the former `getRehydratedState` / `getStateForRouteNamesChange`)
// must never run.

type AnyRouterState = NavigationState<ParamListBase>;
// The concrete router options/actions differ per navigator; the wrapper is agnostic to them.
type AnyRouter = Router<AnyRouterState, { type: string }>;
type AnyRouterFactory = (options: never) => AnyRouter;

export type MethodCall = {
  router: string;
  input: unknown;
  output: unknown;
};

export const routerSpyCalls = {
  reconcileRouteNames: [] as MethodCall[],
};

export function resetRouterSpies() {
  routerSpyCalls.reconcileRouteNames.length = 0;
}

export function wrapRouterFactory<F extends AnyRouterFactory>(name: string, factory: F): F {
  return ((options: never) => {
    const router = factory(options);

    return {
      ...router,
      getStateForAction(...args: Parameters<AnyRouter['getStateForAction']>) {
        const output = router.getStateForAction(...args);
        if (asReconcileRouteNamesAction(args[1])) {
          routerSpyCalls.reconcileRouteNames.push({ router: name, input: args[0], output });
        }
        return output;
      },
    };
  }) as unknown as F;
}
