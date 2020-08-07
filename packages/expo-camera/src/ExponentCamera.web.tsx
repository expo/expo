import * as React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';

import {
  CameraCapturedPicture,
  CameraNativeProps,
  CameraPictureOptions,
  CameraType,
} from './Camera.types';
import CameraManager from './ExponentCameraManager.web';
import { PictureSizes } from './WebConstants';
import { useWebCameraStream } from './useWebCameraStream';
import { useWebQRScanner } from './useWebQRScanner';

export interface ExponentCameraRef {
  getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
  takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
  resumePreview: () => Promise<void>;
  pausePreview: () => Promise<void>;
}

const ExponentCamera = React.forwardRef(
  (
    { type, pictureSize, ...props }: CameraNativeProps & { children?: React.ReactNode },
    ref: React.Ref<ExponentCameraRef>
  ) => {
    const video = React.useRef<HTMLVideoElement | null>(null);

    const native = useWebCameraStream(video, type as CameraType, props, {
      onCameraReady: props.onCameraReady,
      onMountError: props.onMountError,
    });

    const isQRScannerEnabled = React.useMemo<boolean>(() => {
      return !!(
        props.barCodeScannerSettings?.barCodeTypes.includes('qr') && !!props.onBarCodeScanned
      );
    }, [props.barCodeScannerSettings?.barCodeTypes, props.onBarCodeScanned]);

    useWebQRScanner(video, {
      interval: props.barCodeScannerSettings?.interval,
      isEnabled: isQRScannerEnabled,
      captureOptions: { scale: 1, isImageMirror: native.type === CameraType.front },
      onScanned: props.onBarCodeScanned,
      onError: props.onMountError,
    });

    React.useImperativeHandle(
      ref,
      () => ({
        async getAvailablePictureSizes(ratio: string): Promise<string[]> {
          return PictureSizes;
        },
        async takePicture(options: CameraPictureOptions): Promise<CameraCapturedPicture> {
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
        async resumePreview(): Promise<void> {
          await native.resumeAsync();
        },
        async pausePreview(): Promise<void> {
          await native.stopAsync();
        },
      }),
      [native.captureAsync, native.stopAsync, native.resumeAsync, props.onPictureSaved]
    );

    // TODO(Bacon): Create a universal prop, on native the microphone is only used when recording videos.
    // Because we don't support recording video in the browser we don't need the user to give microphone permissions.
    const isMuted = true;

    const style = React.useMemo<StyleProp<ViewStyle>>(() => {
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
          // webkitPlaysinline
          pointerEvents={props.pointerEvents}
          ref={video}
          style={style}
        />
        {props.children}
      </View>
    );
  }
);

export default ExponentCamera;

const Video = React.forwardRef(
  (
    props: React.ComponentProps<typeof View> & {
      autoPlay?: boolean;
      playsInline?: boolean;
      muted?: boolean;
    },
    ref: React.Ref<HTMLVideoElement>
  ) => createElement('video', { ...props, ref })
);

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
