import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform } from 'react-native';
let NativeView;
if (Platform.OS === 'ios') {
    NativeView = requireNativeView('ExpoAppleMaps');
}
function useNativeEvent(userHandler) {
    return React.useCallback((event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
export function AppleMapsView({ onMapClick, onMarkerClick, onCameraMove, annotations, ...props }) {
    const onNativeMapClick = useNativeEvent(onMapClick);
    const onNativeCameraMove = useNativeEvent(onCameraMove);
    const parsedAnnotations = annotations?.map((annotation) => ({
        ...annotation,
        // @ts-expect-error
        icon: annotation.icon?.__expo_shared_object_id__,
    }));
    if (!NativeView) {
        return null;
    }
    return (<NativeView {...props} annotations={parsedAnnotations} onMapClick={onNativeMapClick} onCameraMove={onNativeCameraMove}/>);
}
//# sourceMappingURL=AppleMapsView.js.map