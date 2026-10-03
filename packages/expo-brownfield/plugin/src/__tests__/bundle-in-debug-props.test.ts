import { resolveBundleInDebug } from '../common';

/**
 * `bundleInDebug` is the one option that is meaningful on both platforms, so it can be set once at
 * the top level — mirroring how expo-dev-launcher resolves `props.<platform>?.x ?? props.x`.
 */
describe('resolveBundleInDebug', () => {
  it('defaults to off', () => {
    expect(resolveBundleInDebug(undefined, undefined)).toBe(false);
    expect(resolveBundleInDebug({}, undefined)).toBe(false);
  });

  it('applies a top-level value to a platform that does not override it', () => {
    expect(resolveBundleInDebug({}, true)).toBe(true);
  });

  it('lets a platform override win over the top-level value', () => {
    expect(resolveBundleInDebug({ bundleInDebug: false }, true)).toBe(false);
    expect(resolveBundleInDebug({ bundleInDebug: true }, false)).toBe(true);
  });

  it('accepts a platform-only value', () => {
    expect(resolveBundleInDebug({ bundleInDebug: true }, undefined)).toBe(true);
  });
});
