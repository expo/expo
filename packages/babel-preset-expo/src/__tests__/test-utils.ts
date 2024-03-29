const originalBabelEnv = 'test'; // process.env.BABEL_ENV;
const originalNodeEnv = 'test'; // process.env.NODE_ENV;

export function resetEnv() {
  delete process.env.EXPO_ROUTER_ABS_APP_ROOT;
  delete process.env.EXPO_ROUTER_IMPORT_MODE;
  delete process.env.EXPO_PROJECT_ROOT;
  delete process.env._EXPO_INTERNAL_TESTING;
  process.env.BABEL_ENV = originalBabelEnv;
  process.env.NODE_ENV = originalNodeEnv;
}
