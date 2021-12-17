import { requireNativeComponent } from 'react-native';
import { NativeSafeAreaProviderProps } from './SafeArea.types';

export default requireNativeComponent<NativeSafeAreaProviderProps>(
  'RNCSafeAreaProvider',
);
