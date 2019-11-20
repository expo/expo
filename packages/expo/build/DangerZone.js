/**
 * Modules exported here are experimental and COULD break in the future. Make sure you keep your app
 * up to date if you plan to use any of these.
 */
import removedModule from './removedModule';
/* eslint-disable getter-return */
Object.defineProperties(module.exports, {
    Lottie: {
        enumerable: true,
        get() {
            removedModule(`DangerZone.Lottie -> import Lottie from 'lottie-react-native'`, 'DangerZone.Lottie', 'lottie-react-native');
        },
    },
    Branch: {
        enumerable: true,
        get() {
            removedModule(`DangerZone.Branch -> import Branch, { BranchEvent } from 'react-native-branch'`, 'DangerZone.Branch', 'react-native-branch');
        },
    },
    Stripe: {
        enumerable: true,
        get() {
            removedModule(`DangerZone.Stripe -> import { PaymentsStripe } from 'expo-payments-stripe'`, 'DangerZone.Stripe', 'expo-payments-stripe');
        },
    },
    DeviceMotion: {
        enumerable: true,
        get() {
            removedModule(`DangerZone.DeviceMotion -> import { DeviceMotion } from 'expo-sensors'`, 'DangerZone.DeviceMotion', 'expo-sensors');
        },
    },
    // react-native-reanimated
    Animated: {
        enumerable: true,
        get() {
            removedModule(`DangerZone.Animated -> import Animated from 'react-native-reanimated'`, 'DangerZone.Animated', 'react-native-reanimated');
        },
    },
    Easing: {
        enumerable: true,
        get() {
            removedModule(`DangerZone.Easing -> import { Easing } from 'react-native-reanimated'`, 'DangerZone.Easing', 'react-native-reanimated');
        },
    },
    // react-native-screens
    Screen: {
        enumerable: true,
        get() {
            removedModule(`DangerZone.Screen -> import { Screen } from 'react-native-screens'`, 'DangerZone.Screen', 'react-native-screens');
        },
    },
    ScreenContainer: {
        enumerable: true,
        get() {
            removedModule(`DangerZone.ScreenContainer -> import { ScreenContainer } from 'react-native-screens'`, 'DangerZone.ScreenContainer', 'react-native-screens');
        },
    },
});
//# sourceMappingURL=DangerZone.js.map