import { requireNativeView } from 'expo';
import * as React from 'react';
const NativeView = requireNativeView('ExpoMapsRemake');
function useNativeEvent(userHandler) {
    return React.useCallback((event) => {
        userHandler?.(event.nativeEvent);
    }, [userHandler]);
}
export default function ExpoMapsView({ onMapClick, onPOIClick, onMarkerClick, ...props }) {
    const onNativeMapClick = useNativeEvent(onMapClick);
    const onNativePOIClick = useNativeEvent(onPOIClick);
    const onNativeMarkerClick = useNativeEvent(onMarkerClick);
    return (<NativeView {...props} onMapClick={onNativeMapClick} onPOIClick={onNativePOIClick} onMarkerClick={onNativeMarkerClick}/>);
}
//# sourceMappingURL=ExpoMapsView.js.map