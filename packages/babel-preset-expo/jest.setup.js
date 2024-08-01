import process from 'node:process';

// undefined
const originalBabelEnv = process.env.BABEL_ENV;
// 'test'
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  delete process.env.EXPO_ROUTER_ABS_APP_ROOT;
  delete process.env.EXPO_ROUTER_IMPORT_MODE;
  delete process.env.EXPO_PROJECT_ROOT;
  delete process.env._EXPO_INTERNAL_TESTING;
  process.env.BABEL_ENV = originalBabelEnv;
  process.env.NODE_ENV = originalNodeEnv;
});
