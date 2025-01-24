import { requireNativeView } from 'expo';
import * as React from 'react';
const NativeView = requireNativeView('ExpoGoogleMapsRemake');
function useNativeEvent(userHandler) {
    return React.useCallback((event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
export function MapView({ onMapLoaded, onMapClick, onMapLongClick, onPOIClick, onMarkerClick, onCameraMove, markers, ...props }) {
    const onNativeMapLoaded = React.useCallback(() => {
        onMapLoaded?.();
    }, [onMapLoaded]);
    const onNativeMapClick = useNativeEvent(onMapClick);
    const onNativeMapLongClick = useNativeEvent(onMapLongClick);
    const onNativePOIClick = useNativeEvent(onPOIClick);
    const onNativeMarkerClick = useNativeEvent(onMarkerClick);
    const onNativeCameraMove = useNativeEvent(onCameraMove);
    const parsedMarkers = markers?.map((marker) => ({
        ...marker,
        // @ts-expect-error
        icon: marker.icon?.__expo_shared_object_id__,
    }));
    return (<NativeView {...props} markers={parsedMarkers} onMapLoaded={onNativeMapLoaded} onMapClick={onNativeMapClick} onMapLongClick={onNativeMapLongClick} onPOIClick={onNativePOIClick} onMarkerClick={onNativeMarkerClick} onCameraMove={onNativeCameraMove}/>);
}
//# sourceMappingURL=GoogleMapsView.js.map