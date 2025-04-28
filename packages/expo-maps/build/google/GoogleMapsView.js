import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform, processColor } from 'react-native';
let NativeView = null;
if (Platform.OS === 'android') {
    NativeView = requireNativeView('ExpoGoogleMaps');
}
function useNativeEvent(userHandler) {
    return React.useCallback(
    // TODO(@kitten): We unwrap a native payload here, but this isn't reflected in NativeView's prop types
    (event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
/**
 * @platform android
 */
export const GoogleMapsView = React.forwardRef(({ onMapLoaded, onMapClick, onMapLongClick, onPOIClick, onMarkerClick, onPolylineClick, onCameraMove, markers, polylines, ...props }, ref) => {
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
    const onNativePolylineClick = useNativeEvent(onPolylineClick);
    const parsedPolylines = polylines?.map((polyline) => ({
        ...polyline,
        color: processColor(polyline.color) ?? undefined,
    }));
    const parsedMarkers = markers?.map((marker) => ({
        ...marker,
        // @ts-expect-error
        icon: marker.icon?.__expo_shared_object_id__,
    }));
    if (!NativeView) {
        return null;
    }
    return (<NativeView {...props} ref={nativeRef} markers={parsedMarkers} polylines={parsedPolylines} onMapLoaded={onNativeMapLoaded} onMapClick={onNativeMapClick} onMapLongClick={onNativeMapLongClick} onPOIClick={onNativePOIClick} onMarkerClick={onNativeMarkerClick} onCameraMove={onNativeCameraMove} onPolylineClick={onNativePolylineClick}/>);
});
//# sourceMappingURL=GoogleMapsView.js.map