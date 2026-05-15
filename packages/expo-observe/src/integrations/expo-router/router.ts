// expo-router is an optional peerDependency of expo-observe. When the host app
// hasn't installed it, `require` throws and the integration becomes a no-op.
let optionalRouter: typeof import('expo-router') | undefined;
try {
  optionalRouter = require('expo-router');
} catch {
  // expo-router not installed — integration disabled.
}
const isRouterInstalled = !!optionalRouter;

export { optionalRouter, isRouterInstalled };
