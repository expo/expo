import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoMapsProps } from './ExpoMapsView.types';

const NativeView: React.ComponentType<ExpoMapsProps> = requireNativeView('ExpoMapsRemake');

function useNativeEvent<T>(userHandler?: (data: T) => void) {
  return React.useCallback(
    (event) => {
      userHandler?.(event.nativeEvent);
    },
    [userHandler]
  );
}

export default function ExpoMapsView({
  onMapLoaded,
  onMapClick,
  onMapLongClick,
  onPOIClick,
  onMarkerClick,
  onCameraMove,
  markers,
  ...props
}: ExpoMapsProps) {
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

  return (
    <NativeView
      {...props}
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
