import { Platform, UIManager } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import { Metrics } from './SafeArea.types';

const RNCSafeAreaProviderConstants =
  Platform.OS === 'ios'
    ? requireNativeModule('RNCSafeAreaProvider')
    : (UIManager.getViewManagerConfig('RNCSafeAreaProvider') as any)?.Constants;

export const initialWindowMetrics = (
  RNCSafeAreaProviderConstants != null ? RNCSafeAreaProviderConstants.initialWindowMetrics : null
) as Metrics | null;

/**
 * @deprecated
 */
export const initialWindowSafeAreaInsets = initialWindowMetrics?.insets;
