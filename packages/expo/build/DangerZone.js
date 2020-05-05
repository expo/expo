/**
 * Modules exported here are experimental and COULD break in the future. Make sure you keep your app
 * up to date if you plan to use any of these.
 */
import removedModule from './removedModule';
class DangerZone {
    get Lottie() {
        return removedModule(`DangerZone.Lottie -> import Lottie from 'lottie-react-native'`, 'DangerZone.Lottie', 'lottie-react-native');
    }
    get Branch() {
        return removedModule(`DangerZone.Branch -> import Branch, { BranchEvent } from 'react-native-branch'`, 'DangerZone.Branch', 'react-native-branch');
    }
    get Stripe() {
        return removedModule(`DangerZone.Stripe -> import { PaymentsStripe } from 'expo-payments-stripe'`, 'DangerZone.Stripe', 'expo-payments-stripe');
    }
    get DeviceMotion() {
        return removedModule(`DangerZone.DeviceMotion -> import { DeviceMotion } from 'expo-sensors'`, 'DangerZone.DeviceMotion', 'expo-sensors');
    }
    // react-native-reanimated
    get Animated() {
        return removedModule(`DangerZone.Animated -> import Animated from 'react-native-reanimated'`, 'DangerZone.Animated', 'react-native-reanimated');
    }
    get Easing() {
        return removedModule(`DangerZone.Easing -> import { Easing } from 'react-native-reanimated'`, 'DangerZone.Easing', 'react-native-reanimated');
    }
    // react-native-screens
    get Screen() {
        return removedModule(`DangerZone.Screen -> import { Screen } from 'react-native-screens'`, 'DangerZone.Screen', 'react-native-screens');
    }
    get ScreenContainer() {
        return removedModule(`DangerZone.ScreenContainer -> import { ScreenContainer } from 'react-native-screens'`, 'DangerZone.ScreenContainer', 'react-native-screens');
    }
}
export default new DangerZone();
//# sourceMappingURL=DangerZone.js.map