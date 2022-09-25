import { requireNativeComponent } from 'react-native';
import { NativeSafeAreaViewProps } from './SafeArea.types';

export const SafeAreaView =
  requireNativeComponent<NativeSafeAreaViewProps>('RNCSafeAreaView');
