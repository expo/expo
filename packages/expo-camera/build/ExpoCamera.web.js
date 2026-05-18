import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CodedError } from 'expo-modules-core';
import { useRef, useMemo, useImperativeHandle, } from 'react';
import { StyleSheet, View } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';
import CameraManager from './ExpoCameraManager.web';
import { capture } from './web/WebCameraUtils';
import { PictureSizes } from './web/WebConstants';
import { useWebBarcodeScanner } from './web/useWebBarcodeScanner';
import { useWebCameraStream } from './web/useWebCameraStream';
const ExponentCamera = ({ facing, poster, ref, ...props }) => {
    const video = useRef(null);
    const cameraSettings = useMemo(() => ({
        ...props,
        flashMode: props.enableTorch ? 'torch' : props.flashMode,
    }), [props.enableTorch, props.flashMode, props.zoom, props.autoFocus]);
    const native = useWebCameraStream(video, facing, cameraSettings, {
        onCameraReady: props.onCameraReady,
        onMountError: props.onMountError,
    });
    const barcodeTypes = props.barcodeScannerSettings?.barcodeTypes;
    const isScannerEnabled = useMemo(() => {
        return !!barcodeTypes?.length && !!props.onBarcodeScanned;
    }, [barcodeTypes, props.onBarcodeScanned]);
    useWebBarcodeScanner(video, {
        interval: 300,
        isEnabled: isScannerEnabled,
        barcodeTypes: barcodeTypes ?? [],
        isMirrored: native.type === 'front',
        onScanned: props.onBarcodeScanned,
    });
    useImperativeHandle(ref, () => ({
        async getAvailablePictureSizes() {
            return PictureSizes;
        },
        async takePicture(options) {
            if (!video.current || video.current.readyState !== video.current.HAVE_ENOUGH_DATA) {
                throw new CodedError('ERR_CAMERA_NOT_READY', 'HTMLVideoElement does not have enough camera data to construct an image yet.');
            }
            const settings = native.mediaTrackSettings;
            if (!settings) {
                throw new CodedError('ERR_CAMERA_NOT_READY', 'MediaStream is not ready yet.');
            }
            return capture(video.current, settings, {
                ...options,
                onPictureSaved(picture) {
                    options.onPictureSaved?.(picture);
                    props.onPictureSaved?.({ nativeEvent: { data: picture, id: -1 } });
                },
            });
        },
        async resumePreview() {
            if (video.current) {
                video.current.play();
            }
        },
        async pausePreview() {
            if (video.current) {
                video.current.pause();
            }
        },
        async stopRecording() {
            console.warn('stopRecording is not supported on web.');
        },
        async record() {
            console.warn('record is not supported on web.');
            return { uri: '' };
        },
        async toggleRecording() {
            console.warn('toggleRecording is not supported on web.');
        },
        async launchModernScanner() {
            console.warn('launchModernScanner is not supported on web.');
        },
        async getAvailableLenses() {
            console.warn('getAvailableLenses is not supported on web.');
            return [];
        },
    }), [native.mediaTrackSettings, props.onPictureSaved]);
    const style = useMemo(() => {
        const isFrontFacingCamera = native.type === CameraManager.Type.front;
        return [
            StyleSheet.absoluteFill,
            styles.video,
            {
                pointerEvents: props.pointerEvents,
                // Flip the camera
                transform: isFrontFacingCamera ? [{ scaleX: -1 }] : undefined,
            },
        ];
    }, [props.pointerEvents, native.type]);
    return (_jsxs(View, { style: [styles.videoWrapper, props.style], children: [_jsx(Video, { autoPlay: true, playsInline: true, muted: true, poster: poster, ref: video, style: style }), props.children] }));
};
export default ExponentCamera;
const Video = (props) => createElement('video', { ...props });
const styles = StyleSheet.create({
    videoWrapper: {
        flex: 1,
        alignItems: 'stretch',
        pointerEvents: 'box-none',
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
});
//# sourceMappingURL=ExpoCamera.web.js.map