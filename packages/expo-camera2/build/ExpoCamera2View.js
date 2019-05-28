var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as React from 'react';
import { findNodeHandle } from 'react-native';
import { Facing, FlashMode, Autofocus, WhiteBalance, } from './ExpoCamera2.types';
import ExpoNativeCameraView from './ExpoCamera2NativeView';
import ExpoCamera2ViewManager from './ExpoCamera2NativeViewManager';
import UnavailabilityError from './UnavailabilityError';
/**
 * TODO: ensure MVP example is working one!
 * Example:
 * ```ts
 * import * as React from 'react';
 * import { View, Test, StyleSheet } from 'react-native';
 * import * as Camera from 'um-camera';
 *
 * interface State {
 *   permissionsGranted?: boolean;
 *   takingPhoto: boolean;
 *   takenPicture?: any;
 * }
 *
 * class CameraComponent extends React.Component<{}, State> {
 *   readonly state: State = {
 *     takingPhoto: false;
 *   };
 *
 *   componentDidMount() {
 *     this.askForPermissions();
 *   }
 *
 *   async askForPermissions() {
 *     const { status } = await Permissions.askAsync(Permissions.CAMERA);
 *     this.setState({ permissionsGranted: status === Permissions.Granted });
 *   }
 *
 *   async handleTakingPhoto() {
 *   }
 *
 *   render () {
 *     const { permissionsGranted } = this.state;
 *     if (!permissionsGranted) {
 *        return (
 *          <View style={styles.container}>
 *          </View>
 *        )
 *     }
 *
 *     return (
 *       <View styles={{ flex: 1 }}>
 *         <Camera.View styles={{ flex: 1 }}/>
 *         <View styles={{ }}>
 *           <Button onPress={this.handleTakingPhoto}/>
 *         </View>
 *       <View/>
 *     )
 *   }
 * }
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     flex: 1,
 *   },
 *   cameraView: {
 *   },
 *   optionsView: {
 *   },
 *   takingPictureButton: {
 *   },
 * });
 * ```
 */
export default class ExpoCamera2View extends React.Component {
    /**
     * Pauses the camera view.
     * TODO: is any operation permitted in this state?
     */
    pausePreviewAsync() {
        return ExpoCamera2ViewManager.pausePreviewAsync(this.cameraNodeHandle);
    }
    /**
     * Resumes previously pasued preview.
     */
    resumePreviewAsync() {
        return ExpoCamera2ViewManager.resumePreviewAsync(this.cameraNodeHandle);
    }
    /**
     * Takes a picture and saves it to app's cache directory.
     * Photos are rotated to match device's orientation (on Android only if **options.skipProcessing** flag is not enabled) and scaled to match the preview.
     * TODO: Anyway on Android it is essential to set ratio prop to get a picture with correct dimensions.
     *
     * > Resulting local image URI is temporary.
     * > Use **Expo.FileSystem.copyAsync** to make a permanent copy of the image.
     */
    takePictureAsync(options = {}) {
        return ExpoCamera2ViewManager.takePictureAsync(options, this.cameraNodeHandle);
    }
    /**
     * Starts recording a video that will be saved to cache directory.
     * Videos are rotated to match device's orientation.
     * Resulting promise is returned either if:
     * - **stopRecording** method was invoked
     * - one of **maxDuration** aor **maxFileSize** is reached
     * - TODO: or camera preview is stopped (what about **pausePreviewAsync** method?)
     *
     * TODO: Flipping camera during a recording results in stopping it?
     *
     * > Resulting video URI is temporary.
     * > Use **Expo.FileSystem.copyAsync** to make a permanent copy of the video.
     */
    recordAsync(options = {}) {
        return ExpoCamera2ViewManager.recordAsync(options, this.cameraNodeHandle);
    }
    /**
     * Stops recording if any is in progress.
     */
    stopRecordingAsync() {
        return ExpoCamera2ViewManager.stopRecordingAsync(this.cameraNodeHandle);
    }
    /**
     * Get aspect ratios that are supported by the device.
     * @Android only
     */
    getAvailableRatiosAsync() {
        return ExpoCamera2ViewManager.getAvailableRatiosAsync(this.cameraNodeHandle);
    }
    /**
     * Get picture sizes that are supported by the device for given ratio.
     * Returned list varies across **Android** devices but is the same for every **iOS**.
     */
    getAvailablePictureSizesAsync(ratio) {
        return ExpoCamera2ViewManager.getAvailablePictureSizesAsync(ratio, this.cameraNodeHandle);
    }
    /**
     * Tries to focus camera device on given point.
     * Efect is temporary and upon any device movement might be discarded.
     */
    focusOnPoint(previewFocusPoint) {
        return ExpoCamera2ViewManager.focusOnPoint(previewFocusPoint, this.cameraNodeHandle);
    }
    setNativeReference(ref) {
        if (ref) {
            const cameraNodeHandle = findNodeHandle(ref);
            if (cameraNodeHandle) {
                this.cameraNodeHandle = cameraNodeHandle;
            }
        }
        else {
            this.cameraNodeHandle = undefined;
        }
    }
    render() {
        return (<ExpoNativeCameraView {...this.props} ref={this.setNativeReference}/>);
    }
}
ExpoCamera2View.defaultProps = {
    autofocus: Autofocus.Off,
    facing: Facing.Back,
    flashMode: FlashMode.Off,
    focusDepth: 0.0,
    whiteBalance: WhiteBalance.Auto,
    zoom: 0.0,
    onCameraReady: () => { },
    onMountError: () => { },
};
__decorate([
    ensureAvailable
], ExpoCamera2View.prototype, "pausePreviewAsync", null);
__decorate([
    ensureAvailable
], ExpoCamera2View.prototype, "resumePreviewAsync", null);
__decorate([
    ensureAvailable
], ExpoCamera2View.prototype, "takePictureAsync", null);
__decorate([
    ensureAvailable
], ExpoCamera2View.prototype, "recordAsync", null);
__decorate([
    ensureAvailable
], ExpoCamera2View.prototype, "stopRecordingAsync", null);
__decorate([
    ensureAvailable
], ExpoCamera2View.prototype, "getAvailableRatiosAsync", null);
__decorate([
    ensureAvailable
], ExpoCamera2View.prototype, "getAvailablePictureSizesAsync", null);
__decorate([
    ensureAvailable
], ExpoCamera2View.prototype, "focusOnPoint", null);
function ensureAvailable(target, propertyName, descriptor) {
    const method = descriptor.value;
    // @ts-ignore
    descriptor.value = function (...args) {
        if (!ExpoCamera2ViewManager[propertyName]) {
            throw new UnavailabilityError('Camera', propertyName);
        }
        return method.apply(this, args);
    };
    return descriptor;
}
//# sourceMappingURL=ExpoCamera2View.js.map