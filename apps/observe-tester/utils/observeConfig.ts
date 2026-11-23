import type { ObserveConfig } from 'expo-observe';
import { ReanimatedLogLevel } from 'react-native-reanimated';

/**
 * The config that the root layout passes to `Observe.configure`. The example screens that change the
 * config start from it, because each `configure` call replaces the whole config.
 */
export const observeConfig: ObserveConfig = {
  environment: 'custom-env',
  dispatchingEnabled: true,
  dispatchInDebug: true,
  sampleRate: 1,
  errorSampleRate: 1,
  // ignoredMetrics: ['expo.app_startup.tti'],
  // ignoredEvents: ['debug.info_button_pressed'],
  integrations: {
    'expo-router': {
      filteredParams: ['accountId', 'firstName'],
    },
    'expo-image': {
      oversizeThreshold: 1.5,
      includeUrlParams: false,
    },
    'react-native-reanimated': {
      level: ReanimatedLogLevel.warn,
      strict: true,
      reportWarnings: true,
    },
  },
  networkTraces: true,
};
