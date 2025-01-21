import { requireNativeView } from 'expo';
import * as React from 'react';
const NativeView = requireNativeView('ExpoMapsRemake');
function useNativeEvent(userHandler) {
    return React.useCallback((event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
export default function ExpoMapsView({ onMapClick, onPOIClick, ...props }) {
    const onNativeMapClick = useNativeEvent(onMapClick);
    const onNativePOIClick = useNativeEvent(onPOIClick);
    return <NativeView {...props} onMapClick={onNativeMapClick} onPOIClick={onNativePOIClick}/>;
}
//# sourceMappingURL=ExpoMapsView.js.map