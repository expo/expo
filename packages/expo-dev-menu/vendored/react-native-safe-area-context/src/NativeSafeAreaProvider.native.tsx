import { requireNativeComponent, Platform } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';
import { NativeSafeAreaProviderProps } from './SafeArea.types';

export default Platform.OS === 'ios'
  ? requireNativeViewManager<NativeSafeAreaProviderProps>('RNCSafeAreaProvider')
  : requireNativeComponent<NativeSafeAreaProviderProps>('RNCSafeAreaProvider');
