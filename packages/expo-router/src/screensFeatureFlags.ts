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
  }
}

// Solves iOS bugs related to quick dismissal of several screens in a row
// Will become opt-out in the future versions of screens
// TODO(@ubax): Remove after dropping react-native-screens v4 support; this is a no-op in v5.
featureFlags.experiment.iosPreventReattachmentOfDismissedScreens = true;
