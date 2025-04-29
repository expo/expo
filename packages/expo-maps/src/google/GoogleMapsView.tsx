import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform, processColor } from 'react-native';

import type {
  GoogleMapsViewProps,
  GoogleMapsViewType,
  SetCameraPositionConfig,
} from './GoogleMaps.types';

let NativeView: React.ComponentType<GoogleMapsViewProps> | null = null;

if (Platform.OS === 'android') {
  NativeView = requireNativeView('ExpoGoogleMaps');
}

function useNativeEvent<T>(userHandler?: (data: T) => void) {
  return React.useCallback(
    // TODO(@kitten): We unwrap a native payload here, but this isn't reflected in NativeView's prop types
    (event: any) => {
      userHandler?.(event.nativeEvent);
    },
    [userHandler]
  );
}

/**
 * @platform android
 */
export const GoogleMapsView = React.forwardRef<GoogleMapsViewType, GoogleMapsViewProps>(
  (
    {
      onMapLoaded,
      onMapClick,
      onMapLongClick,
      onPOIClick,
      onMarkerClick,
      onPolylineClick,
      onPolygonClick,
      onCameraMove,
      markers,
      polylines,
      polygons,
      ...props
    },
    ref
  ) => {
    const nativeRef = React.useRef<GoogleMapsViewType>(null);
    React.useImperativeHandle(ref, () => ({
      setCameraPosition(config?: SetCameraPositionConfig) {
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
    const onNativePolygonClick = useNativeEvent(onPolygonClick);

    const parsedPolylines = polylines?.map((polyline) => ({
      ...polyline,
      color: processColor(polyline.color) ?? undefined,
    }));

    const parsedMarkers = markers?.map((marker) => ({
      ...marker,
      // @ts-expect-error
      icon: marker.icon?.__expo_shared_object_id__,
    }));

    const parsedPolygons = polygons?.map((polygon) => ({
      ...polygon,
      color: processColor(polygon.color) ?? undefined,
      lineColor: processColor(polygon.color) ?? undefined,
    }));

    if (!NativeView) {
      return null;
    }
    return (
      <NativeView
        {...props}
        ref={nativeRef}
        markers={parsedMarkers}
        polylines={parsedPolylines}
        polygons={parsedPolygons}
        onMapLoaded={onNativeMapLoaded}
        onMapClick={onNativeMapClick}
        onMapLongClick={onNativeMapLongClick}
        onPOIClick={onNativePOIClick}
        onMarkerClick={onNativeMarkerClick}
        onCameraMove={onNativeCameraMove}
        onPolylineClick={onNativePolylineClick}
        onPolygonClick={onNativePolygonClick}
      />
    );
  }
);
