import { Platform } from 'react-native';
import { Constants } from 'expo-constants';
import { NativeAR } from './NativeAR';
export function isAvailable() {
    // if (
    //   !Constants.isDevice || // Prevent Simulators
    //   Platform.isTVOS ||
    //   (Platform.OS === 'ios' && Constants.deviceYearClass < 2015) || // iOS device has A9 chip
    //   // !ExpoAR.isSupported || // ARKit is included in the build
    //   !ExpoAR.startAsync // Older SDK versions (27 and lower) that are fully compatible
    // ) {
    //   console.log('AR.isAvailable: false');
    //   return false;
    // }
    return true;
}
const AvailabilityErrorMessages = {
    Simulator: `Cannot run EXGL in a simulator`,
    ANineChip: `ARKit can only run on iOS devices with A9 (2015) or greater chips! This is a`,
    ARKitOnlyOnIOS: `ARKit can only run on an iOS device! This is a`,
};
export function getUnavailabilityReason() {
    if (!Constants.isDevice) {
        return AvailabilityErrorMessages.Simulator;
    }
    else if (Platform.OS !== 'ios') {
        return `${AvailabilityErrorMessages.ARKitOnlyOnIOS} ${Platform.OS} device`;
    }
    else if (Constants.deviceYearClass < 2015) {
        return `${AvailabilityErrorMessages.ANineChip} ${Constants.deviceYearClass} device`;
    }
    return 'Unknown Reason';
}
export function getVersion() {
    return NativeAR.ARKitVersion;
}
//# sourceMappingURL=availibility.js.map