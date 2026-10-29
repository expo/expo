import type { ObserveConfig } from '../types';

it('accepts supported metrics and custom event names', () => {
  const config: ObserveConfig = {
    ignoredMetrics: [
      'expo.app_startup.load_time',
      'expo.app_startup.launch_time',
      'expo.navigation.tti',
    ],
    ignoredEvents: ['js.exception', 'expo-image.oversized', 'checkout.completed'],
  };
  expect(config.ignoredMetrics).toHaveLength(3);
  expect(config.ignoredEvents).toHaveLength(3);
});

it('rejects unsupported metric names at typecheck', () => {
  // @ts-expect-error Unsupported metric names are rejected.
  const unsupported: ObserveConfig = { ignoredMetrics: ['expo.navigation.tbt'] };
  expect(unsupported.ignoredMetrics).toEqual(['expo.navigation.tbt']);
});
