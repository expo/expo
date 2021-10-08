import { _setShouldThrowAnErrorOutsideOfExpo } from 'expo/build/environment/validatorState';

// @ts-ignore: Swap this out for an environment variable in the future
import Constants from 'expo-constants'; // eslint-disable-line import/order
_setShouldThrowAnErrorOutsideOfExpo(false);

global.DETOX = !Constants.isDevice;
