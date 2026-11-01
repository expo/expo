import { registerBundleWithReactNativeHMR } from '../registerBundleWithReactNativeHMR';

it('does not register native HMR bundles on web', () => {
  expect(registerBundleWithReactNativeHMR('http://localhost:8081/AsyncScreen.bundle')).toBe(false);
});
