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

export function MapView({
  onMapClick,
  onMarkerClick,
  onCameraMove,
  annotations,
  ...props
}: MapProps) {
  const onNativeMapClick = useNativeEvent(onMapClick);
  const onNativeCameraMove = useNativeEvent(onCameraMove);

  const parsedAnnotations = annotations?.map((annotation) => ({
    ...annotation,
    // @ts-expect-error
    icon: annotation.icon?.__expo_shared_object_id__,
  }));

  return (
    <NativeView
      {...props}
      annotations={parsedAnnotations}
      onMapClick={onNativeMapClick}
      onCameraMove={onNativeCameraMove}
    />
  );
}
