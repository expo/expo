import { requireNativeViewManager } from 'expo-modules-core';
import { NativeSafeAreaProviderProps } from './SafeArea.types';

export default requireNativeViewManager<NativeSafeAreaProviderProps>('RNCSafeAreaProvider')
