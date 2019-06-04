import React, { CSSProperties } from 'react';
import { findNodeHandle, StyleSheet, View } from 'react-native';
import { CapturedPicture, NativeProps, PictureOptions, MountError } from './Camera.types';
import CameraModule, { CameraType } from './CameraModule/CameraModule';
import CameraManager from './ExponentCameraManager.web';

export default class ExponentCamera extends React.Component<NativeProps> {
  video?: number | null;
  camera?: CameraModule;

  state = { type: null };

  componentWillUnmount() {
    if (this.camera) {
      this.camera.unmount();
    }
  }

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
  }: NativeProps) => {
    const { camera } = this;
    if (!camera) {
      return;
    }
    await Promise.all([
      camera.setTypeAsync(type as CameraType),
      camera.setPictureSize(pictureSize as string),
      camera.setZoomAsync(zoom as number),
      camera.setAutoFocusAsync(autoFocus as string),
      camera.setWhiteBalanceAsync(whiteBalance as string),
      camera.setFlashModeAsync(flashMode as string),
      camera.ensureCameraIsRunningAsync(),
    ]);
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

  onMountError = ({ nativeEvent }: { nativeEvent: MountError }) => {
    if (this.props.onMountError) {
      this.props.onMountError({ nativeEvent });
    }
  };

  _setRef = ref => {
    if (!ref) {
      this.video = null;
      if (this.camera) {
        this.camera.unmount();
        this.camera = undefined;
      }
      return;
    }
    this.video = findNodeHandle(ref);
    this.camera = new CameraModule(ref);
    this.camera.onCameraReady = this.onCameraReady;
    this.camera.onMountError = this.onMountError;
    this._updateCameraProps(this.props);
  };

  render() {
    const transform = this.state.type === CameraManager.Type.front ? 'rotateY(180deg)' : 'none';
    const style: CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform,
    };

    return (
      <View style={[styles.videoWrapper, this.props.style]}>
        <video ref={this._setRef} style={style} autoPlay playsInline />
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  videoWrapper: {
    flex: 1,
    alignItems: 'stretch',
  },
});
