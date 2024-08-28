import { Platform, requireNativeViewManager, UnavailabilityError } from 'expo-modules-core';
import * as React from 'react';
import { Text, View } from 'react-native';
import { isAvailable } from './LivePhotoModule';
const NativeView = isAvailable()
    ? requireNativeViewManager('ExpoLivePhoto')
    : null;
export default React.forwardRef((props, ref) => {
    const nativeRef = React.useRef(null);
    React.useImperativeHandle(ref, () => ({
        startPlayback: (playbackStyle) => {
            if (!isAvailable()) {
                throw new UnavailabilityError('expo-live-photo', 'startPlayback');
            }
            nativeRef.current?.startPlayback(playbackStyle ?? 'full');
        },
        stopPlayback: () => {
            if (!isAvailable()) {
                throw new UnavailabilityError('expo-live-photo', 'stopPlayback');
            }
            nativeRef.current?.stopPlayback();
        },
    }));
    if (!isAvailable() || !NativeView) {
        return (<View>
        <Text>Expo-live-photo is not available on {Platform.OS}</Text>
      </View>);
    }
    return (<NativeView {...props} ref={nativeRef} onLoadError={(event) => {
            props.onLoadError?.(event.nativeEvent);
        }}/>);
});
//# sourceMappingURL=LivePhotoView.js.map