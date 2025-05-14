import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform, processColor } from 'react-native';

import { CameraPosition, Coordinates } from '../shared.types';
import type { AppleMapsViewProps, AppleMapsViewType } from './AppleMaps.types';

let NativeView: React.ComponentType<AppleMapsViewProps> | null;

if (Platform.OS === 'ios') {
  NativeView = requireNativeView('ExpoAppleMaps');
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
 * @platform ios
 */
export const AppleMapsView = React.forwardRef<AppleMapsViewType, AppleMapsViewProps>(
  (
    {
      onMapClick,
      onMarkerClick,
      onCameraMove,
      onPolylineClick,
      onCircleClick,
      onPolygonClick,
      annotations,
      polylines,
      circles,
      polygons,
      ...props
    },
    ref
  ) => {
    const nativeRef = React.useRef<AppleMapsViewType>(null);
    React.useImperativeHandle(ref, () => ({
      setCameraPosition(config?: CameraPosition) {
        return nativeRef.current?.setCameraPosition(config);
      },
      async openLookAroundAsync(coordinates: Coordinates) {
        return nativeRef.current?.openLookAroundAsync(coordinates);
      },
    }));

    const onNativeMapClick = useNativeEvent(onMapClick);
    const onNativeMarkerClick = useNativeEvent(onMarkerClick);
    const onNativeCameraMove = useNativeEvent(onCameraMove);
    const onNativePolylineClick = useNativeEvent(onPolylineClick);
    const onNativePolygonClick = useNativeEvent(onPolygonClick);
    const onNativeCircleClick = useNativeEvent(onCircleClick);

    const parsedPolylines = polylines?.map((polyline) => ({
      ...polyline,
      color: processColor(polyline.color) ?? undefined,
    }));

    const parsedPolygons = polygons?.map((polygon) => ({
      ...polygon,
      color: processColor(polygon.color) ?? undefined,
      lineColor: processColor(polygon.lineColor) ?? undefined,
    }));

    const parsedCircles = circles?.map((circle) => ({
      ...circle,
      color: processColor(circle.color) ?? undefined,
      lineColor: processColor(circle.lineColor) ?? undefined,
    }));

    const parsedAnnotations = annotations?.map((annotation) => ({
      ...annotation,
      // @ts-expect-error
      icon: annotation.icon?.__expo_shared_object_id__,
    }));

    if (!NativeView) {
      return null;
    }

    return (
      <NativeView
        {...props}
        ref={nativeRef}
        polylines={parsedPolylines}
        polygons={parsedPolygons}
        circles={parsedCircles}
        annotations={parsedAnnotations}
        onMapClick={onNativeMapClick}
        onMarkerClick={onNativeMarkerClick}
        onCameraMove={onNativeCameraMove}
        onPolylineClick={onNativePolylineClick}
        onPolygonClick={onNativePolygonClick}
        onCircleClick={onNativeCircleClick}
      />
    );
  }
);
