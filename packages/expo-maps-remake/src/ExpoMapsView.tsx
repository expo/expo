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

export default function ExpoMapsView({ onMapClick, onPOIClick, ...props }: ExpoMapsProps) {
  const onNativeMapClick = useNativeEvent(onMapClick);
  const onNativePOIClick = useNativeEvent(onPOIClick);

  return <NativeView {...props} onMapClick={onNativeMapClick} onPOIClick={onNativePOIClick} />;
}
