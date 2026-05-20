import { CodedError } from 'expo-modules-core';
import {
  type PropsWithChildren,
  useRef,
  useMemo,
  useImperativeHandle,
  type ComponentProps,
  type Ref,
} from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';

import type {
  CameraNativeProps,
  CameraCapturedPicture,
  CameraPictureOptions,
  CameraType,
} from './Camera.types';
import CameraManager from './ExpoCameraManager.web';
import { capture } from './web/WebCameraUtils';
import { PictureSizes } from './web/WebConstants';
import { useWebBarcodeScanner } from './web/useWebBarcodeScanner';
import { useWebCameraStream } from './web/useWebCameraStream';

export interface ExponentCameraRef {
  getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
  takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
  resumePreview: () => Promise<void>;
  pausePreview: () => Promise<void>;
}

const ExponentCamera = ({
  facing,
  poster,
  ref,
  ...props
}: PropsWithChildren<CameraNativeProps>) => {
  const video = useRef<HTMLVideoElement | null>(null);

  const cameraSettings = useMemo(
    () => ({
      ...props,
      flashMode: props.enableTorch ? 'torch' : props.flashMode,
    }),
    [props.enableTorch, props.flashMode, props.zoom, props.autoFocus]
  );

  const native = useWebCameraStream(video, facing as CameraType, cameraSettings, {
    onCameraReady: props.onCameraReady,
    onMountError: props.onMountError,
  });

  const barcodeTypes = props.barcodeScannerSettings?.barcodeTypes;

  const isScannerEnabled = useMemo<boolean>(() => {
    return !!barcodeTypes?.length && !!props.onBarcodeScanned;
  }, [barcodeTypes, props.onBarcodeScanned]);

  useWebBarcodeScanner(video, {
    interval: 300,
    isEnabled: isScannerEnabled,
    barcodeTypes: barcodeTypes ?? [],
    isMirrored: native.type === 'front',
    onScanned: props.onBarcodeScanned,
  });

  useImperativeHandle(
    ref,
    () => ({
      async getAvailablePictureSizes(): Promise<string[]> {
        return PictureSizes;
      },
      async takePicture(options: CameraPictureOptions): Promise<CameraCapturedPicture> {
        if (!video.current || video.current.readyState !== video.current.HAVE_ENOUGH_DATA) {
          throw new CodedError(
            'ERR_CAMERA_NOT_READY',
            'HTMLVideoElement does not have enough camera data to construct an image yet.'
          );
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
      async resumePreview(): Promise<void> {
        if (video.current) {
          video.current.play();
        }
      },
      async pausePreview(): Promise<void> {
        if (video.current) {
          video.current.pause();
        }
      },
      async stopRecording(): Promise<void> {
        console.warn('stopRecording is not supported on web.');
      },
      async record(): Promise<{ uri: string }> {
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
    }),
    [native.mediaTrackSettings, props.onPictureSaved]
  );

  const style = useMemo<StyleProp<ViewStyle>>(() => {
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

  return (
    <View style={[styles.videoWrapper, props.style]}>
      <Video autoPlay playsInline muted poster={poster} ref={video} style={style} />
      {props.children}
    </View>
  );
};

export default ExponentCamera;

const Video = (
  props: ComponentProps<typeof View> & {
    autoPlay?: boolean;
    playsInline?: boolean;
    muted?: boolean;
    poster?: string;
    ref: Ref<HTMLVideoElement>;
  }
) => createElement('video', { ...props });

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
