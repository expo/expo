import { UIManager } from 'react-native';
import { Metrics } from './SafeArea.types';

const DevMenuRNCSafeAreaProviderConfig = UIManager.getViewManagerConfig(
  'DevMenuRNCSafeAreaProvider',
) as any;

export const initialWindowMetrics = (
  DevMenuRNCSafeAreaProviderConfig != null &&
  DevMenuRNCSafeAreaProviderConfig.Constants != null
    ? DevMenuRNCSafeAreaProviderConfig.Constants.initialWindowMetrics
    : null
) as Metrics | null;

/**
 * @deprecated
 */
export const initialWindowSafeAreaInsets = initialWindowMetrics?.insets;
