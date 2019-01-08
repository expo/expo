import React, { CSSProperties } from 'react';
import { findNodeHandle, StyleSheet, View } from 'react-native';

import { CapturedPicture, NativePropsType, PictureOptions } from './Camera.types';
import CameraModule from './CameraModule/CameraModule';
import CameraManager from './ExponentCameraManager.web';

export default class ExponentCamera extends React.Component<NativePropsType> {
  video?: number | null;
  camera: CameraModule | null = null;

  state = { type: null };
  componentWillReceiveProps(nextProps) {
    this._updateCameraProps(nextProps);
  }

  _updateCameraProps = async ({
    type,
    zoom,
    pictureSize,
    flashMode,
    autoFocus,
    // focusDepth,
    whiteBalance,
  }) => {
    const { camera } = this;
    if (camera == null) {
      return;
    }

    // TODO: Bacon: Batch process
    camera.setTypeAsync(type);
    camera.setPictureSize(pictureSize);
    camera.setZoomAsync(zoom);
    camera.setAutoFocusAsync(autoFocus);
    camera.setWhiteBalanceAsync(whiteBalance);
    camera.setFlashModeAsync(flashMode);
    await camera.ensureCameraIsRunningAsync();
    const actualCameraType = camera.getActualCameraType();
    if (actualCameraType !== this.state.type) {
      this.setState({ type: actualCameraType });
    }
  };

  getCamera = (): CameraModule => {
    if (this.camera == null) {
      throw new Error('Camera is not defined yet!');
    }
    return this.camera;
  };

  getAvailablePictureSizes = async (ratio: string): Promise<string[]> => {
    const camera = this.getCamera();
    return camera.getAvailablePictureSizes(ratio);
  };

  takePicture = async (options: PictureOptions): Promise<CapturedPicture> => {
    const camera = this.getCamera();
    return camera.takePicture({
      ...options,
      // This will always be defined, the option gets added to a queue in the upper-level. We should replace the original so it isn't called twice.
      onPictureSaved: this.props.onPictureSaved,
    });
  };

  resumePreview = async (): Promise<void> => {
    const camera = this.getCamera();
    await camera.resumePreview();
  };

  pausePreview = (): void => {
    const camera = this.getCamera();
    camera.pausePreview();
  };

  onCameraReady = () => {
    if (this.props.onCameraReady) {
      this.props.onCameraReady();
    }
  };

  onMountError = error => {
    if (this.props.onMountError) {
      this.props.onMountError(error);
    }
  };

  _setRef = async ref => {
    this.video = findNodeHandle(ref);
    this.camera = new CameraModule(ref);
    this.camera.onCameraReady = this.onCameraReady;
    this.camera.onMountError = this.onMountError;
    this._updateCameraProps(this.props as any);
  };

  render() {
    const transform = this.state.type === CameraManager.Type.front ? 'rotateY(180deg)' : 'none';
    const reactStyle = StyleSheet.flatten(this.props.style);
    const style: CSSProperties = {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform,
    };

    return (
      <View style={{ flex: 1, alignItems: 'stretch', ...reactStyle }}>
        <video ref={this._setRef} style={style} autoPlay playsInline />
        {this.props.children}
      </View>
    );
  }
}
