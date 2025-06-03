import type { HostComponent, ViewProps } from 'react-native';
import type { DirectEventHandler, Int32 } from 'react-native/Libraries/Types/CodegenTypes';
type OnPreviewTappedEvent = {};
export interface NativeProps extends ViewProps {
    nextScreenKey?: Int32;
    onPreviewTapped?: DirectEventHandler<OnPreviewTappedEvent>;
    onWillPreviewOpen?: DirectEventHandler<OnPreviewTappedEvent>;
    onDidPreviewOpen?: DirectEventHandler<OnPreviewTappedEvent>;
    onPreviewClose?: DirectEventHandler<OnPreviewTappedEvent>;
}
declare const _default: HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=PeekAndPopNativeComponent.d.ts.map