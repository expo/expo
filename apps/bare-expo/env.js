// Import expo-asset and register the custom source transformer
import 'expo-asset';

import { setCustomSourceTransformer } from 'expo-asset/build/resolveAssetSource';
// @ts-ignore: Swap this out for an environment variable in the future
import Constants from 'expo-constants'; // eslint-disable-line import/order

import { _setShouldThrowAnErrorOutsideOfExpo } from '~expo/build/environment/validatorState';

_setShouldThrowAnErrorOutsideOfExpo(false);
// Remove custom source transformer added by expo-asset
setCustomSourceTransformer(null);

global.DETOX = !Constants.isDevice;
