import { requireNativeView } from 'expo';
import * as React from 'react';

import type { MapProps } from './AppleMaps.types';

const NativeView: React.ComponentType<MapProps> = requireNativeView('ExpoAppleMaps');

function useNativeEvent<T>(userHandler?: (data: T) => void) {
  return React.useCallback(
    (event) => {
      userHandler?.(event.nativeEvent);
    },
    [userHandler]
  );
}

export function MapView({ onMapClick, onMarkerClick, onCameraMove, markers, ...props }: MapProps) {
  const onNativeMapClick = useNativeEvent(onMapClick);
  const onNativeCameraMove = useNativeEvent(onCameraMove);

  const parsedMarkers = markers?.map((marker) => ({
    ...marker,
    // @ts-expect-error
    icon: marker.icon?.__expo_shared_object_id__,
  }));

  return (
    <NativeView
      {...props}
      markers={parsedMarkers}
      onMapClick={onNativeMapClick}
      onCameraMove={onNativeCameraMove}
    />
  );
}
