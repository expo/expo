import { _setShouldThrowAnErrorOutsideOfExpo } from '~expo/build/environment/validatorState';

// @ts-ignore: Swap this out for an environment variable in the future
import Constants from 'expo-constants';
_setShouldThrowAnErrorOutsideOfExpo(false);

const DETOX = (global.DETOX = !Constants.isDevice);
