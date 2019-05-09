import React, { CSSProperties } from 'react';
import { findNodeHandle, View } from 'react-native';

import { CapturedPicture, MountError, NativeProps, PictureOptions } from './Camera.types';
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
    this.updateCameraProps(nextProps);
  }

  private updateCameraProps = async ({
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
    this.updateScanner();
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

  private setRef = async ref => {
    if (!ref) {
      this.video = null;
      if (this.camera) {
        this.camera.unmount();
        this.camera.stopScanner();
        this.camera = undefined;
      }
      return;
    }
    this.video = findNodeHandle(ref);
    this.camera = new CameraModule(ref);
    this.camera.onCameraReady = this.onCameraReady;
    this.camera.onMountError = this.onMountError;
    this.updateCameraCanvas();
    this.updateCameraProps(this.props);
  };

  private updateScanner = () => {
    if (!this.camera) return;
    const { barCodeScannerSettings, onBarCodeScanned } = this.props;
    if (onBarCodeScanned && barCodeScannerSettings) {
      this.camera.startScanner(
        {
          // Default barcode scanning update interval, same as is defined in the API layer.
          // TODO: Bacon: Make this larger for low-end devices.
          interval: this.shouldRenderIndicator() ? -1 : 500,
          ...barCodeScannerSettings,
        },
        nativeEvent => {
          if (this.props.onBarCodeScanned) {
            this.props.onBarCodeScanned({ nativeEvent });
            return;
          }
          this.updateScanner();
        }
      );
    }
  };

  canvas?: HTMLCanvasElement;

  private setCanvasRef = ref => {
    this.canvas = ref;
    this.updateCameraCanvas();
  };

  private updateCameraCanvas() {
    if (this.camera) {
      this.camera.canvas = this.canvas;
    }
  }

  private shouldRenderIndicator = (): boolean => {
    if (this.props.barCodeScannerSettings) {
      return this.props.barCodeScannerSettings.shouldRenderIndicator || false;
    }
    return false;
  };

  render() {
    const transform = this.state.type === CameraManager.Type.front ? 'rotateY(180deg)' : 'none';
    return (
      <View style={[{ flex: 1, alignItems: 'stretch' }, this.props.style]}>
        <video ref={this.setRef} style={{ ...videoStyle, transform }} autoPlay playsInline />
        {this.shouldRenderIndicator() && <canvas ref={this.setCanvasRef} style={canvasStyle} />}
        {this.props.children}
      </View>
    );
  }
}

const videoStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const canvasStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
};
