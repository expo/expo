import React, { forwardRef } from 'react';
import { createElement, findNodeHandle, StyleSheet, View } from 'react-native';

import {
  CameraCapturedPicture,
  CameraMountError,
  CameraNativeProps,
  CameraPictureOptions,
} from './Camera.types';
import CameraModule, { CameraType } from './CameraModule/CameraModule';
import CameraManager from './ExponentCameraManager.web';

export default class ExponentCamera extends React.Component<CameraNativeProps> {
  video?: number | null;
  camera?: CameraModule;

  state = { type: null };

  componentWillUnmount() {
    if (this.camera) {
      this.camera.stopAsync();
    }
  }

  componentDidUpdate(nextProps) {
    this._updateCameraProps(nextProps);
  }

  _updateCameraProps = async ({ type, pictureSize, ...webCameraSettings }: CameraNativeProps) => {
    const { camera } = this;
    if (!camera) {
      return;
    }

    await camera.setTypeAsync(type as CameraType);

    await camera.updateWebCameraSettingsAsync(webCameraSettings);

    // await camera.setPictureSize(pictureSize as string);

    await camera.ensureCameraIsRunningAsync();

    const actualCameraType = camera.getActualCameraType();
    if (actualCameraType !== this.state.type) {
      this.setState({ type: actualCameraType });
    }
  };

  getCamera = (): CameraModule => {
    if (this.camera) {
      return this.camera;
    }
    throw new Error('Camera is not defined yet!');
  };

  getAvailablePictureSizes = async (ratio: string): Promise<string[]> => {
    const camera = this.getCamera();
    return camera.getAvailablePictureSizes(ratio);
  };

  takePicture = async (options: CameraPictureOptions): Promise<CameraCapturedPicture> => {
    const camera = this.getCamera();
    return camera.takePicture({
      ...options,
      // This will always be defined, the option gets added to a queue in the upper-level. We should replace the original so it isn't called twice.
      onPictureSaved: this.props.onPictureSaved,
    });
  };

  getAvailableCameraTypesAsync = async (): Promise<string[]> => {
    const camera = this.getCamera();
    return await camera.getAvailableCameraTypesAsync();
  };

  resumePreview = async (): Promise<void> => {
    const camera = this.getCamera();
    await camera.resumePreview();
  };

  pausePreview = async (): Promise<void> => {
    const camera = this.getCamera();
    await camera.stopAsync();
  };

  onCameraReady = () => {
    if (this.props.onCameraReady) {
      this.props.onCameraReady();
    }
  };

  onMountError = ({ nativeEvent }: { nativeEvent: CameraMountError }) => {
    if (this.props.onMountError) {
      this.props.onMountError({ nativeEvent });
    }
  };

  _setRef = ref => {
    if (!ref) {
      this.video = null;
      if (this.camera) {
        this.camera.stopAsync();
        this.camera = undefined;
      }
      return;
    }
    this.video = findNodeHandle(ref);

    (this.video as any).webkitPlaysinline = true;

    this.camera = new CameraModule(ref);
    this.camera.onCameraReady = this.onCameraReady;
    this.camera.onMountError = this.onMountError;
    this._updateCameraProps(this.props);
  };

  render() {
    const { pointerEvents } = this.props;

    // TODO: Bacon: Create a universal prop, on native the microphone is only used when recording videos.
    // Because we don't support recording video in the browser we don't need the user to give microphone permissions.
    const isMuted = true;

    const isFrontFacingCamera = this.state.type === CameraManager.Type.front;
    const style = {
      // Flip the camera
      transform: isFrontFacingCamera ? [{ scaleX: -1 }] : undefined,
    };

    return (
      <View pointerEvents="box-none" style={[styles.videoWrapper, this.props.style]}>
        <Video
          autoPlay
          playsInline
          muted={isMuted}
          pointerEvents={pointerEvents}
          ref={this._setRef}
          style={[StyleSheet.absoluteFill, styles.video, style]}
        />
        {this.props.children}
      </View>
    );
  }
}

const Video: any = forwardRef((props, ref) => createElement('video', { ...props, ref }));

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
