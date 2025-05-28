import type { HostComponent, ViewProps } from 'react-native';
import type { DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type OnPreviewTappedEvent = {};

export interface NativeProps extends ViewProps {
  onPreviewTapped?: DirectEventHandler<OnPreviewTappedEvent>;
}

export default codegenNativeComponent<NativeProps>('PeekAndPop') as HostComponent<NativeProps>;
