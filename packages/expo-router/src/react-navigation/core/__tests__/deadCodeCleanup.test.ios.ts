import fs from 'fs';
import path from 'path';

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
    expect(navigationBuilder).toContain('useStoreSlice');
    expect(navigationHelpers).not.toContain('stateRef');
  });

  it('keeps initialization/reconciliation helpers out of the public Router contract', () => {
    const routerTypes = readRouterFile('types.tsx');
    const publicRouter = routerTypes.slice(
      routerTypes.indexOf('export type Router<'),
      routerTypes.indexOf('export type InternalRouter<')
    );

    expect(publicRouter).not.toContain('getInitialState');
    expect(publicRouter).not.toContain('getRehydratedState');
    expect(publicRouter).not.toContain('getStateForRouteNamesChange');
    expect(publicRouter).not.toContain('getStateForRouteFocus');
    expect(publicRouter).not.toContain('shouldActionChangeFocus');
    expect(routerTypes).toContain('export type InternalRouter<');
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
});
