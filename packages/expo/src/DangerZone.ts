/**
 * Modules exported here are experimental and COULD break in the future. Make sure you keep your app
 * up to date if you plan to use any of these.
 */
import deprecatedModule from './deprecatedModule';

export default {
  get Lottie() {
    deprecatedModule(
      `DangerZone.Lottie -> import Lottie from 'lottie-react-native'`,
      'lottie-react-native'
    );
    return require('lottie-react-native');
  },
  get Branch() {
    deprecatedModule(
      `DangerZone.Branch -> import Branch, { BranchEvent } from 'react-native-branch'`,
      'react-native-branch'
    );
    return require('./Branch').default;
  },
  get Stripe() {
    deprecatedModule(
      `DangerZone.Stripe -> import { PaymentsStripe } from 'expo-payments-stripe'`,
      'expo-payments-stripe'
    );
    return require('expo-payments-stripe').PaymentsStripe;
  },
  get DeviceMotion() {
    deprecatedModule(
      `DangerZone.DeviceMotion -> import { DeviceMotion } from 'expo-sensors'`,
      'expo-sensors'
    );
    return require('expo-sensors').DeviceMotion;
  },

  // react-native-reanimated
  get Animated() {
    deprecatedModule(
      `DangerZone.Animated -> import Animated from 'react-native-reanimated'`,
      'react-native-reanimated'
    );
    return require('./Animated').default;
  },
  get Easing() {
    deprecatedModule(
      `DangerZone.Easing -> import { Easing } from 'react-native-reanimated'`,
      'react-native-reanimated'
    );
    return require('./Animated').Easing;
  },

  // react-native-screens
  get Screen() {
    deprecatedModule(
      `DangerZone.Screen -> import { Screen } from 'react-native-screens'`,
      'react-native-screens'
    );
    return require('react-native-screens').Screen;
  },
  get ScreenContainer() {
    deprecatedModule(
      `DangerZone.ScreenContainer -> import { ScreenContainer } from 'react-native-screens'`,
      'react-native-screens'
    );
    return require('react-native-screens').ScreenContainer;
  },
  get ScreenStack() {
    deprecatedModule(
      `DangerZone.ScreenStack -> import { ScreenStack } from 'react-native-screens'`,
      'react-native-screens'
    );
    return require('react-native-screens').ScreenStack;
  },
};
