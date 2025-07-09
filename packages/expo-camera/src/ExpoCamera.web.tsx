import { CodedError } from 'expo-modules-core';
import {
  type PropsWithChildren,
  useRef,
  useMemo,
  useImperativeHandle,
  type ComponentProps,
  type Ref,
} from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';

import {
  CameraNativeProps,
  CameraCapturedPicture,
  CameraPictureOptions,
  CameraType,
} from './Camera.types';
import CameraManager from './ExpoCameraManager.web';
import { capture } from './web/WebCameraUtils';
import { PictureSizes } from './web/WebConstants';
import { useWebCameraStream } from './web/useWebCameraStream';
import { useWebQRScanner } from './web/useWebQRScanner';

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

  const native = useWebCameraStream(video, facing as CameraType, props, {
    onCameraReady() {
      if (props.onCameraReady) {
        props.onCameraReady();
      }
    },
    onMountError: props.onMountError,
  });

  const isQRScannerEnabled = useMemo<boolean>(() => {
    return Boolean(
      props.barcodeScannerSettings?.barcodeTypes?.includes('qr') && !!props.onBarcodeScanned
    );
  }, [props.barcodeScannerSettings?.barcodeTypes, props.onBarcodeScanned]);

  useWebQRScanner(video, {
    interval: 300,
    isEnabled: isQRScannerEnabled,
    captureOptions: { scale: 1, isImageMirror: native.type === 'front' },
    onScanned(event) {
      if (props.onBarcodeScanned) {
        props.onBarcodeScanned(event);
      }
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      async getAvailablePictureSizes(): Promise<string[]> {
        return PictureSizes;
      },
      async takePicture(options: CameraPictureOptions): Promise<CameraCapturedPicture> {
        if (!video.current || video.current?.readyState !== video.current?.HAVE_ENOUGH_DATA) {
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

  // TODO(Bacon): Create a universal prop, on native the microphone is only used when recording videos.
  // Because we don't support recording video in the browser we don't need the user to give microphone permissions.
  const isMuted = true;

  const style = useMemo<StyleProp<ViewStyle>>(() => {
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

  return (
    <View pointerEvents="box-none" style={[styles.videoWrapper, props.style]}>
      <Video
        autoPlay
        playsInline
        muted={isMuted}
        poster={poster}
        pointerEvents={props.pointerEvents}
        ref={video}
        style={style}
      />
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
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});
