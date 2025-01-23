import { requireNativeView } from 'expo';
import * as React from 'react';
const NativeView = requireNativeView('ExpoMapsRemake');
function useNativeEvent(userHandler) {
    return React.useCallback((event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
export default function ExpoMapsView({ onMapClick, onPOIClick, onMarkerClick, onCameraMove, markers, ...props }) {
    const onNativeMapClick = useNativeEvent(onMapClick);
    const onNativePOIClick = useNativeEvent(onPOIClick);
    const onNativeMarkerClick = useNativeEvent(onMarkerClick);
    const onNativeCameraMove = useNativeEvent(onCameraMove);
    const parsedMarkers = markers?.map((marker) => ({
        ...marker,
        icon: marker.icon?.__expo_shared_object_id__,
    }));
    return (<NativeView {...props} markers={parsedMarkers} onMapClick={onNativeMapClick} onPOIClick={onNativePOIClick} onMarkerClick={onNativeMarkerClick} onCameraMove={onNativeCameraMove}/>);
}
//# sourceMappingURL=ExpoMapsView.js.map