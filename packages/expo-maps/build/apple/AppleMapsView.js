import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform, processColor } from 'react-native';
let NativeView;
if (Platform.OS === 'ios') {
    NativeView = requireNativeView('ExpoAppleMaps');
}
function useNativeEvent(userHandler) {
    return React.useCallback(
    // TODO(@kitten): We unwrap a native payload here, but this isn't reflected in NativeView's prop types
    (event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
/**
 * @platform ios
 */
export const AppleMapsView = React.forwardRef(({ onMapClick, onMarkerClick, onCameraMove, onPolylineClick, onPolygonClick, annotations, polylines, polygons, ...props }, ref) => {
    const nativeRef = React.useRef(null);
    React.useImperativeHandle(ref, () => ({
        setCameraPosition(config) {
            nativeRef.current?.setCameraPosition(config);
        },
    }));
    const onNativeMapClick = useNativeEvent(onMapClick);
    const onNativeMarkerClick = useNativeEvent(onMarkerClick);
    const onNativeCameraMove = useNativeEvent(onCameraMove);
    const onNativePolylineClick = useNativeEvent(onPolylineClick);
    const onNativePolygonClick = useNativeEvent(onPolygonClick);
    const parsedPolylines = polylines?.map((polyline) => ({
        ...polyline,
        color: processColor(polyline.color) ?? undefined,
    }));
    const parsedPolygons = polygons?.map((polygon) => ({
        ...polygon,
        color: processColor(polygon.color) ?? undefined,
        lineColor: processColor(polygon.lineColor) ?? undefined,
    }));
    const parsedAnnotations = annotations?.map((annotation) => ({
        ...annotation,
        // @ts-expect-error
        icon: annotation.icon?.__expo_shared_object_id__,
    }));
    if (!NativeView) {
        return null;
    }
    return (<NativeView {...props} ref={nativeRef} polylines={parsedPolylines} polygons={parsedPolygons} annotations={parsedAnnotations} onMapClick={onNativeMapClick} onMarkerClick={onNativeMarkerClick} onCameraMove={onNativeCameraMove} onPolylineClick={onNativePolylineClick} onPolygonClick={onNativePolygonClick}/>);
});
//# sourceMappingURL=AppleMapsView.js.map