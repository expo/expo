import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform } from 'react-native';

import type { AppleMapsViewProps } from './AppleMaps.types';

let NativeView: React.ComponentType<AppleMapsViewProps> | null;

if (Platform.OS === 'ios') {
  NativeView = requireNativeView('ExpoAppleMaps');
}

function useNativeEvent<T>(userHandler?: (data: T) => void) {
  return React.useCallback(
    (event) => {
      userHandler?.(event.nativeEvent);
    },
    [userHandler]
  );
}

/**
 * @platform ios
 */
export function AppleMapsView({
  onMapClick,
  onMarkerClick,
  onCameraMove,
  annotations,
  ...props
}: AppleMapsViewProps) {
  const onNativeMapClick = useNativeEvent(onMapClick);
  const onNativeMarkerClick = useNativeEvent(onMarkerClick);
  const onNativeCameraMove = useNativeEvent(onCameraMove);

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
      annotations={parsedAnnotations}
      onMapClick={onNativeMapClick}
      onMarkerClick={onNativeMarkerClick}
      onCameraMove={onNativeCameraMove}
    />
  );
}
