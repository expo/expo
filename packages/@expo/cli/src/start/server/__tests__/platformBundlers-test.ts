import type { ExpoConfig } from '@expo/config';

import { getPlatformBundlers } from '../platformBundlers';

describe(getPlatformBundlers, () => {
  it('selects rollipop for tvos/macos via a global bundler override', () => {
    const exp = { platforms: ['ios', 'android', 'tvos', 'macos'] } as Partial<ExpoConfig>;
    const bundlers = getPlatformBundlers('/', exp, 'rollipop');
    expect(bundlers.ios).toBe('rollipop');
    expect(bundlers.android).toBe('rollipop');
    expect(bundlers.tvos).toBe('rollipop');
    expect(bundlers.macos).toBe('rollipop');
  });

  it('selects rollipop for tvos/macos via per-platform config', () => {
    const exp = {
      platforms: ['ios', 'android', 'tvos', 'macos'],
      tvos: { bundler: 'rollipop' },
      macos: { bundler: 'rollipop' },
    } as unknown as Partial<ExpoConfig>;
    const bundlers = getPlatformBundlers('/', exp);
    expect(bundlers.tvos).toBe('rollipop');
    expect(bundlers.macos).toBe('rollipop');
    // Unconfigured platforms fall back to metro.
    expect(bundlers.ios).toBe('metro');
    expect(bundlers.android).toBe('metro');
  });

  it('explicit override wins over per-platform config', () => {
    const exp = {
      platforms: ['ios', 'tvos'],
      tvos: { bundler: 'metro' },
    } as unknown as Partial<ExpoConfig>;
    const bundlers = getPlatformBundlers('/', exp, 'rollipop');
    expect(bundlers.tvos).toBe('rollipop');
  });

  it('defaults tvos/macos to metro when no rollipop config is present', () => {
    const exp = {
      platforms: ['ios', 'android', 'tvos', 'macos'],
    } as Partial<ExpoConfig>;
    const bundlers = getPlatformBundlers('/', exp);
    expect(bundlers.tvos).toBe('metro');
    expect(bundlers.macos).toBe('metro');
    expect(bundlers.ios).toBe('metro');
    expect(bundlers.android).toBe('metro');
  });
});
