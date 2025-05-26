import type { HostComponent, ViewProps } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {}

export default codegenNativeComponent<NativeProps>('PeekAndPop') as HostComponent<NativeProps>;
