import React, { forwardRef } from 'react';
import { createElement, findNodeHandle, StyleSheet, View } from 'react-native';
import CameraModule from './CameraModule/CameraModule';
import CameraManager from './ExponentCameraManager.web';
export default class ExponentCamera extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { type: null };
        this._updateCameraProps = async ({ type, pictureSize, ...webCameraSettings }) => {
            const { camera } = this;
            if (!camera) {
                return;
            }
            await camera.setTypeAsync(type);
            await camera.updateWebCameraSettingsAsync(webCameraSettings);
            // await camera.setPictureSize(pictureSize as string);
            await camera.ensureCameraIsRunningAsync();
            const actualCameraType = camera.getActualCameraType();
            if (actualCameraType !== this.state.type) {
                this.setState({ type: actualCameraType });
            }
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
        this.getAvailableCameraTypesAsync = async () => {
            const camera = this.getCamera();
            return await camera.getAvailableCameraTypesAsync();
        };
        this.resumePreview = async () => {
            const camera = this.getCamera();
            await camera.resumePreview();
        };
        this.pausePreview = async () => {
            const camera = this.getCamera();
            await camera.stopAsync();
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
        this._setRef = ref => {
            if (!ref) {
                this.video = null;
                if (this.camera) {
                    this.camera.stopAsync();
                    this.camera = undefined;
                }
                return;
            }
            this.video = findNodeHandle(ref);
            this.video.webkitPlaysinline = true;
            this.camera = new CameraModule(ref);
            this.camera.onCameraReady = this.onCameraReady;
            this.camera.onMountError = this.onMountError;
            this._updateCameraProps(this.props);
        };
    }
    componentWillUnmount() {
        if (this.camera) {
            this.camera.stopAsync();
        }
    }
    componentDidUpdate(nextProps) {
        this._updateCameraProps(nextProps);
    }
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
        return (<View pointerEvents="box-none" style={[styles.videoWrapper, this.props.style]}>
        <Video autoPlay playsInline muted={isMuted} pointerEvents={pointerEvents} ref={this._setRef} style={[StyleSheet.absoluteFill, styles.video, style]}/>
        {this.props.children}
      </View>);
    }
}
const Video = forwardRef((props, ref) => createElement('video', { ...props, ref }));
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
//# sourceMappingURL=ExponentCamera.web.js.map