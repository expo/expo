import type { HostComponent, ViewProps } from 'react-native';
import type { DirectEventHandler, Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type OnPreviewTappedEvent = {};

export interface NativeProps extends ViewProps {
  nextScreenKey?: Int32;
  onPreviewTapped?: DirectEventHandler<OnPreviewTappedEvent>;
  onWillPreviewOpen?: DirectEventHandler<OnPreviewTappedEvent>;
  onDidPreviewOpen?: DirectEventHandler<OnPreviewTappedEvent>;
  onPreviewClose?: DirectEventHandler<OnPreviewTappedEvent>;
}

export default codegenNativeComponent<NativeProps>('PeekAndPop') as HostComponent<NativeProps>;
