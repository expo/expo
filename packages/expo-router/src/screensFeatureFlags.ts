import Constants from 'expo-constants';
import { featureFlags } from 'react-native-screens';

const areSynchronousUpdatesDisabled =
  !!Constants.expoConfig?.extra?.router?.disableSynchronousScreensUpdates;

let hasInitialized = false;

export function initScreensFeatureFlags() {
  if (!hasInitialized) {
    hasInitialized = true;
    featureFlags.experiment.synchronousScreenUpdatesEnabled = !areSynchronousUpdatesDisabled;
    featureFlags.experiment.synchronousHeaderConfigUpdatesEnabled = !areSynchronousUpdatesDisabled;
    featureFlags.experiment.synchronousHeaderSubviewUpdatesEnabled = !areSynchronousUpdatesDisabled;
    featureFlags.experiment.controlledBottomTabs = process.env.EXPO_OS !== 'ios';
  }
}
