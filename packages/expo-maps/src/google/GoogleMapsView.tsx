import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform } from 'react-native';

import type { MapViewType, MapProps } from './GoogleMaps.types';

type NativeMapViewProps = MapProps & {
  ref: React.MutableRefObject<MapViewType | null>;
};

let NativeView: React.ComponentType<NativeMapViewProps> | null = null;

if (Platform.OS === 'android') {
  NativeView = requireNativeView('ExpoGoogleMaps');
}

function useNativeEvent<T>(userHandler?: (data: T) => void) {
  return React.useCallback(
    (event) => {
      userHandler?.(event.nativeEvent);
    },
    [userHandler]
  );
}

export const MapView = React.forwardRef(
  (
    {
      onMapLoaded,
      onMapClick,
      onMapLongClick,
      onPOIClick,
      onMarkerClick,
      onCameraMove,
      markers,
      ...props
    }: MapProps,
    ref
  ) => {
    const nativeRef = React.useRef<MapViewType | null>(null);
    React.useImperativeHandle(ref, () => ({
      setCameraPosition(config: MapViewType['setCameraPosition']['arguments'][0]) {
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
    return (
      <NativeView
        {...props}
        ref={nativeRef}
        markers={parsedMarkers}
        onMapLoaded={onNativeMapLoaded}
        onMapClick={onNativeMapClick}
        onMapLongClick={onNativeMapLongClick}
        onPOIClick={onNativePOIClick}
        onMarkerClick={onNativeMarkerClick}
        onCameraMove={onNativeCameraMove}
      />
    );
  }
);
