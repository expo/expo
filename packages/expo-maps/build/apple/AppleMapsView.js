import { requireNativeView } from 'expo';
import * as React from 'react';
const NativeView = requireNativeView('ExpoAppleMaps');
function useNativeEvent(userHandler) {
    return React.useCallback((event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
export function MapView({ onMapClick, onMarkerClick, onCameraMove, annotations, ...props }) {
    const onNativeMapClick = useNativeEvent(onMapClick);
    const onNativeCameraMove = useNativeEvent(onCameraMove);
    const parsedAnnotations = annotations?.map((annotation) => ({
        ...annotation,
        // @ts-expect-error
        icon: annotation.icon?.__expo_shared_object_id__,
    }));
    return (<NativeView {...props} annotations={parsedAnnotations} onMapClick={onNativeMapClick} onCameraMove={onNativeCameraMove}/>);
}
//# sourceMappingURL=AppleMapsView.js.map