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

// Solves iOS bugs related to quick dismissal of several screens in a row
// Will become opt-out in the future versions of screens
// TODO(@ubax): Remove this flag when it becomes default behavior in react-native-screens
featureFlags.experiment.iosPreventReattachmentOfDismissedScreens = true;
