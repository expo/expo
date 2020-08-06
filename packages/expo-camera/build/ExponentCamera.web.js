import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';
import CameraManager from './ExponentCameraManager.web';
import { PictureSizes } from './WebConstants';
import { useWebCameraStream } from './useWebCameraStream';
const ExponentCamera = React.forwardRef(({ type, pictureSize, ...props }, ref) => {
    const video = React.useRef(null);
    const native = useWebCameraStream(video, type, props, {
        onCameraReady: props.onCameraReady,
        onMountError: props.onMountError,
    });
    React.useImperativeHandle(ref, () => ({
        async getAvailablePictureSizes(ratio) {
            return PictureSizes;
        },
        async takePicture(options) {
            return native.captureAsync({
                ...options,
                // This will always be defined, the option gets added to a queue in the upper-level. We should replace the original so it isn't called twice.
                onPictureSaved(picture) {
                    if (options.onPictureSaved) {
                        options.onPictureSaved(picture);
                    }
                    if (props.onPictureSaved) {
                        props.onPictureSaved({ nativeEvent: { data: picture, id: -1 } });
                    }
                },
            });
        },
        async resumePreview() {
            await native.resumeAsync();
        },
        async pausePreview() {
            await native.stopAsync();
        },
    }), [native.captureAsync, native.stopAsync, native.resumeAsync, props.onPictureSaved]);
    // TODO(Bacon): Create a universal prop, on native the microphone is only used when recording videos.
    // Because we don't support recording video in the browser we don't need the user to give microphone permissions.
    const isMuted = true;
    const style = React.useMemo(() => {
        const isFrontFacingCamera = native.type === CameraManager.Type.front;
        return [
            StyleSheet.absoluteFill,
            styles.video,
            {
                // Flip the camera
                transform: isFrontFacingCamera ? [{ scaleX: -1 }] : undefined,
            },
        ];
    }, [native.type]);
    return (React.createElement(View, { pointerEvents: "box-none", style: [styles.videoWrapper, props.style] },
        React.createElement(Video, { autoPlay: true, playsInline: true, muted: isMuted, 
            // webkitPlaysinline
            pointerEvents: props.pointerEvents, ref: video, style: style }),
        props.children));
});
export default ExponentCamera;
const Video = React.forwardRef((props, ref) => createElement('video', { ...props, ref }));
const styles = StyleSheet.create({
    videoWrapper: {
        flex: 1,
        alignItems: 'stretch',
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
});
//# sourceMappingURL=ExponentCamera.web.js.map