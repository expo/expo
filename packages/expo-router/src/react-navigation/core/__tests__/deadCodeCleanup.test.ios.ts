import fs from 'fs';
import path from 'path';

import type { NavigationAction, NavigationState, Router } from '../../routers';

// Exact type-equality: true only when `A` and `B` are structurally identical.
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const coreDir = path.join(__dirname, '..');
const routersDir = path.join(__dirname, '..', '..', 'routers');
const globalStateDir = path.join(__dirname, '..', '..', '..', 'global-state');

function readCoreFile(file: string) {
  return fs.readFileSync(path.join(coreDir, file), 'utf8');
}

function readRouterFile(file: string) {
  return fs.readFileSync(path.join(routersDir, file), 'utf8');
}

function readGlobalStateFile(file: string) {
  return fs.readFileSync(path.join(globalStateDir, file), 'utf8');
}

describe('global-state Step 11 cleanup', () => {
  it('removes the render-time action/schedule modules from the core read path', () => {
    expect(fs.existsSync(path.join(coreDir, 'useOnAction.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(coreDir, 'useScheduleUpdate.tsx'))).toBe(false);

    const navigationBuilder = readCoreFile('useNavigationBuilder.tsx');
    const navigationHelpers = readCoreFile('useNavigationHelpers.tsx');

    expect(navigationBuilder).not.toContain('useOnAction');
    expect(navigationBuilder).not.toContain('useScheduleUpdate');
    // Post-flip the builder renders from the slice its parent hands down through
    // `NavigationStateContext` (a `SceneView` provides `state: routeState`), not from a per-navigator
    // uSES subscription — the retired `useStoreSlice` read is gone with the store's render channel.
    expect(navigationBuilder).not.toContain('useStoreSlice');
    expect(navigationBuilder).toContain('NavigationStateContext');
    expect(navigationHelpers).not.toContain('stateRef');
  });

  it('keeps the public Router contract to getStateForAction + actionCreators only', () => {
    // Load-bearing, semantic guard: `keyof Router` must be exactly these two members. Re-adding any
    // former router-specific method (getInitialState, getRehydratedState, getStateForRouteNamesChange,
    // getStateForRouteFocus, shouldActionChangeFocus) to `Router` fails typecheck right here — no
    // reliance on comment/marker positions in the source file.
    const routerContractIsMinimal: Equals<
      keyof Router<NavigationState, NavigationAction>,
      'getStateForAction' | 'actionCreators'
    > = true;
    expect(routerContractIsMinimal).toBe(true);

    // The methods and the retired transitional `InternalRouter` alias are physically gone from the file.
    const routerTypes = readRouterFile('types.tsx');
    expect(routerTypes).not.toContain('getInitialState');
    expect(routerTypes).not.toContain('getRehydratedState');
    expect(routerTypes).not.toContain('getStateForRouteNamesChange');
    expect(routerTypes).not.toContain('getStateForRouteFocus');
    expect(routerTypes).not.toContain('shouldActionChangeFocus');
    expect(routerTypes).not.toContain('InternalRouter');
  });
});

describe('global-state Step 11-b cleanup', () => {
  it('removes the never-wired root reducer shadow mismatch diagnostic', () => {
    const rootReducer = readGlobalStateFile('rootReducer.ts');

    expect(rootReducer).not.toContain('getRootReducerShadowMismatch');
    expect(rootReducer).not.toContain('RootReducerShadowMismatch');
  });

  it('removes the dead local ancestor-focus plumbing (registry drives focus)', () => {
    expect(fs.existsSync(path.join(coreDir, 'useOnRouteFocus.tsx'))).toBe(false);

    expect(readCoreFile('useNavigationBuilder.tsx')).not.toContain('onRouteFocus');
    expect(readCoreFile('useDescriptors.tsx')).not.toContain('onRouteFocus');
    expect(readCoreFile('NavigationBuilderContext.tsx')).not.toContain('onRouteFocus');
  });

  it('removes the render-time nested structural-param bridge from the builder', () => {
    const navigationBuilder = readCoreFile('useNavigationBuilder.tsx');

    // The container's root dispatch is now the only interpreter of nested `screen`/`state`/`initial`
    // params; the builder must not decode or consume them during render.
    expect(navigationBuilder).not.toContain('CONSUMED_PARAMS');
    expect(navigationBuilder).not.toContain('getStateFromParams');
    expect(navigationBuilder).not.toContain('initialParamsFromParams');

    // No direct structural reads of the nested-navigation params object.
    expect(navigationBuilder).not.toMatch(/params\??\.(screen|state|initial)\b/);
  });
});

describe('single-source dead surfaces', () => {
  it('drops the unused per-key reducer accessors from the registry (entry API is the only one)', () => {
    const storeContext = readGlobalStateFile('storeContext.ts');

    expect(storeContext).not.toContain('addReducer');
    expect(storeContext).not.toContain('removeReducer');
    expect(storeContext).not.toContain('getReducer');
    // The live registry API stays.
    expect(storeContext).toContain('addEntry');
    expect(storeContext).toContain('hasReducer');
  });

  it('drops the never-consumed setState slot from NavigationStateContext (dispatchRoot is the only writer)', () => {
    const navigationStateContext = readCoreFile('NavigationStateContext.tsx');
    const sceneView = readCoreFile('SceneView.tsx');

    expect(navigationStateContext).not.toContain('setState');
    // SceneView no longer provides a no-op state writer into the context.
    expect(sceneView).not.toContain('setCurrentState');
  });
});
