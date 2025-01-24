import { requireNativeView } from 'expo';
import * as React from 'react';
const NativeView = requireNativeView('ExpoAppleMapsRemake');
function useNativeEvent(userHandler) {
    return React.useCallback((event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
export function MapView({ onMapClick, onMarkerClick, onCameraMove, markers, ...props }) {
    const onNativeMapClick = useNativeEvent(onMapClick);
    const onNativeCameraMove = useNativeEvent(onCameraMove);
    const parsedMarkers = markers?.map((marker) => ({
        ...marker,
        // @ts-expect-error
        icon: marker.icon?.__expo_shared_object_id__,
    }));
    return (<NativeView {...props} markers={parsedMarkers} onMapClick={onNativeMapClick} onCameraMove={onNativeCameraMove}/>);
}
//# sourceMappingURL=AppleMapsView.js.map