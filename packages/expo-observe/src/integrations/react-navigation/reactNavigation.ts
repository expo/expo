// @react-navigation/native is an optional peerDependency. When the host app
// hasn't installed it, `require` throws and the integration becomes a no-op.
let optionalReactNavigation: typeof import('@react-navigation/native') | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  optionalReactNavigation = require('@react-navigation/native');
} catch {}
const isReactNavigationInstalled = !!optionalReactNavigation;

export { optionalReactNavigation, isReactNavigationInstalled };
