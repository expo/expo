"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScreensFeatureFlags = initScreensFeatureFlags;
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_native_screens_1 = require("react-native-screens");
const areSynchronousUpdatesDisabled = !!expo_constants_1.default.expoConfig?.extra?.router?.disableSynchronousScreensUpdates;
let hasInitialized = false;
function initScreensFeatureFlags() {
    if (!hasInitialized) {
        hasInitialized = true;
        react_native_screens_1.featureFlags.experiment.synchronousScreenUpdatesEnabled = !areSynchronousUpdatesDisabled;
        react_native_screens_1.featureFlags.experiment.synchronousHeaderConfigUpdatesEnabled = !areSynchronousUpdatesDisabled;
        react_native_screens_1.featureFlags.experiment.synchronousHeaderSubviewUpdatesEnabled = !areSynchronousUpdatesDisabled;
        react_native_screens_1.featureFlags.experiment.controlledBottomTabs = process.env.EXPO_OS !== 'ios';
    }
}
// Solves iOS bugs related to quick dismissal of several screens in a row
// Will become opt-out in the future versions of screens
// TODO(@ubax): Remove this flag when it becomes default behavior in react-native-screens
react_native_screens_1.featureFlags.experiment.iosPreventReattachmentOfDismissedScreens = true;
//# sourceMappingURL=screensFeatureFlags.js.map