import React from 'react';
import { findNodeHandle, View } from 'react-native';
import CameraModule from './CameraModule/CameraModule';
import CameraManager from './ExponentCameraManager.web';
export default class ExponentCamera extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { type: null };
        this.updateCameraProps = async ({ type, zoom, pictureSize, flashMode, autoFocus, 
        // focusDepth,
        whiteBalance, }) => {
            const { camera } = this;
            if (!camera) {
                return;
            }
            await Promise.all([
                camera.setTypeAsync(type),
                camera.setPictureSize(pictureSize),
                camera.setZoomAsync(zoom),
                camera.setAutoFocusAsync(autoFocus),
                camera.setWhiteBalanceAsync(whiteBalance),
                camera.setFlashModeAsync(flashMode),
                camera.ensureCameraIsRunningAsync(),
            ]);
            const actualCameraType = camera.getActualCameraType();
            if (actualCameraType !== this.state.type) {
                this.setState({ type: actualCameraType });
            }
            this.updateScanner();
        };
        this.getCamera = () => {
            if (this.camera) {
                return this.camera;
            }
            throw new Error('Camera is not defined yet!');
        };
        this.getAvailablePictureSizes = async (ratio) => {
            const camera = this.getCamera();
            return camera.getAvailablePictureSizes(ratio);
        };
        this.takePicture = async (options) => {
            const camera = this.getCamera();
            return camera.takePicture({
                ...options,
                // This will always be defined, the option gets added to a queue in the upper-level. We should replace the original so it isn't called twice.
                onPictureSaved: this.props.onPictureSaved,
            });
        };
        this.resumePreview = async () => {
            const camera = this.getCamera();
            await camera.resumePreview();
        };
        this.pausePreview = () => {
            const camera = this.getCamera();
            camera.pausePreview();
        };
        this.onCameraReady = () => {
            if (this.props.onCameraReady) {
                this.props.onCameraReady();
            }
        };
        this.onMountError = ({ nativeEvent }) => {
            if (this.props.onMountError) {
                this.props.onMountError({ nativeEvent });
            }
        };
        this.setRef = async (ref) => {
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
            this.updateCameraProps(this.props);
        };
        this.updateScanner = () => {
            if (!this.camera)
                return;
            const { barCodeScannerSettings } = this.props;
            if (this.props.onBarCodeScanned && barCodeScannerSettings) {
                this.camera.startScanner({
                    // Default barcode scanning update interval, same as is defined in the API layer.
                    // TODO: Bacon: Make this larger for low-end devices.
                    interval: 500,
                    ...barCodeScannerSettings,
                }, nativeEvent => {
                    if (this.props.onBarCodeScanned) {
                        this.props.onBarCodeScanned({ nativeEvent });
                        return;
                    }
                    this.updateScanner();
                });
            }
            else {
            }
        };
    }
    componentWillUnmount() {
        if (this.camera) {
            this.camera.unmount();
        }
    }
    componentWillReceiveProps(nextProps) {
        this.updateCameraProps(nextProps);
    }
    render() {
        const transform = this.state.type === CameraManager.Type.front ? 'rotateY(180deg)' : 'none';
        return (<View style={[{ flex: 1, alignItems: 'stretch' }, this.props.style]}>
        <video ref={this.setRef} style={{ ...videoStyle, transform }} autoPlay playsInline/>
        {this.props.children}
      </View>);
    }
}
const videoStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
};
//# sourceMappingURL=ExponentCamera.web.js.map