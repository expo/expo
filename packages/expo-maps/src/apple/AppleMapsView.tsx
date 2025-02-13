import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform } from 'react-native';

import type { AppleMapsViewType, CameraPosition, MapProps } from './AppleMaps.types';

let NativeView: React.ComponentType<MapProps> | null;

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
export const AppleMapsView = React.forwardRef<AppleMapsViewType, MapProps>(
  ({ onMapClick, onMarkerClick, onCameraMove, annotations, ...props }, ref) => {
    const nativeRef = React.useRef<AppleMapsViewType>(null);
    React.useImperativeHandle(ref, () => ({
      setCameraPosition(config?: CameraPosition) {
        nativeRef.current?.setCameraPosition(config);
      },
    }));

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
        ref={nativeRef}
        annotations={parsedAnnotations}
        onMapClick={onNativeMapClick}
        onMarkerClick={onNativeMarkerClick}
        onCameraMove={onNativeCameraMove}
      />
    );
  }
);
