/**
 * Modules exported here are experimental and COULD break in the future. Make sure you keep your app
 * up to date if you plan to use any of these.
 */

export default {
  get Lottie() {
    return require('lottie-react-native');
  },
  get Branch() {
    return require('./Branch').default;
  },
  get GestureHandler() {
    console.warn(
      'GestureHandler is no longer in DangerZone, you can now import it directly from the expo package.'
    );
    return require('react-native-gesture-handler');
  },
  get Localization() {
    return require('./Localization').default;
  },
  get Stripe() {
    return require('expo-payments-stripe').PaymentsStripe;
  },
  get Print() {
    console.warn(
      'Print is no longer in DangerZone, you can now import it directly from the expo package.'
    );
    return require('expo-print').Print;
  },
  get DeviceMotion() {
    return require('expo-sensors').DeviceMotion;
  },

  // react-native-reanimated
  get Animated() {
    return require('react-native-reanimated').default;
  },
  get Easing() {
    return require('react-native-reanimated').Easing;
  },

  // react-native-screens
  get Screen() {
    return require('react-native-screens').Screen;
  },
  get ScreenContainer() {
    return require('react-native-screens').ScreenContainer;
  },
  get ScreenStack() {
    return require('react-native-screens').ScreenStack;
  },
};
