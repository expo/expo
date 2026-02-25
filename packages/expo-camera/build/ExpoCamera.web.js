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
    const cameraSettings = useMemo(() => {
        return {
            ...props,
            flashMode: props.enableTorch ? 'torch' : props.flashMode,
        };
    }, [props.enableTorch, props.flashMode, props.zoom, props.autoFocus]);
    const native = useWebCameraStream(video, facing, cameraSettings, {
        onCameraReady() {
            if (props.onCameraReady) {
                props.onCameraReady();
            }
        },
        onMountError: props.onMountError,
    });
    const barcodeTypes = props.barcodeScannerSettings?.barcodeTypes;
    const isScannerEnabled = useMemo(() => {
        return Boolean(barcodeTypes?.length && !!props.onBarcodeScanned);
    }, [barcodeTypes, props.onBarcodeScanned]);
    useWebBarcodeScanner(video, {
        interval: 300,
        isEnabled: isScannerEnabled,
        barcodeTypes: barcodeTypes ?? [],
        isMirrored: native.type === 'front',
        onScanned(event) {
            if (props.onBarcodeScanned) {
                props.onBarcodeScanned(event);
            }
        },
    });
    useImperativeHandle(ref, () => ({
        async getAvailablePictureSizes() {
            return PictureSizes;
        },
        async takePicture(options) {
            if (!video.current || video.current?.readyState !== video.current?.HAVE_ENOUGH_DATA) {
                throw new CodedError('ERR_CAMERA_NOT_READY', 'HTMLVideoElement does not have enough camera data to construct an image yet.');
            }
            const settings = native.mediaTrackSettings;
            if (!settings) {
                throw new CodedError('ERR_CAMERA_NOT_READY', 'MediaStream is not ready yet.');
            }
            return capture(video.current, settings, {
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
    // TODO(Bacon): Create a universal prop, on native the microphone is only used when recording videos.
    // Because we don't support recording video in the browser we don't need the user to give microphone permissions.
    const isMuted = true;
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
    return (<View style={[styles.videoWrapper, props.style]}>
      <Video autoPlay playsInline muted={isMuted} poster={poster} ref={video} style={style}/>
      {props.children}
    </View>);
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