import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform } from 'react-native';
let NativeView = null;
if (Platform.OS === 'android') {
    NativeView = requireNativeView('ExpoGoogleMaps');
}
function useNativeEvent(userHandler) {
    return React.useCallback((event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
/**
 * @platform android
 */
export const GoogleMapsView = React.forwardRef(({ onMapLoaded, onMapClick, onMapLongClick, onPOIClick, onMarkerClick, onCameraMove, markers, ...props }, ref) => {
    const nativeRef = React.useRef(null);
    React.useImperativeHandle(ref, () => ({
        setCameraPosition(config) {
            nativeRef.current?.setCameraPosition(config);
        },
    }));
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
    if (!NativeView) {
        return null;
    }
    return (<NativeView {...props} ref={nativeRef} markers={parsedMarkers} onMapLoaded={onNativeMapLoaded} onMapClick={onNativeMapClick} onMapLongClick={onNativeMapLongClick} onPOIClick={onNativePOIClick} onMarkerClick={onNativeMarkerClick} onCameraMove={onNativeCameraMove}/>);
});
//# sourceMappingURL=GoogleMapsView.js.map