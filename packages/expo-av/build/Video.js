import * as React from 'react';
import { findNodeHandle, Image, StyleSheet, View } from 'react-native';
import { assertStatusValuesInBounds, getNativeSourceAndFullInitialStatusForLoadAsync, getNativeSourceFromSource, getUnloadedStatus, PlaybackMixin, } from './AV';
import ExpoVideoManager from './ExpoVideoManager';
import ExponentAV from './ExponentAV';
import ExponentVideo from './ExponentVideo';
import { ResizeMode, } from './Video.types';
const _STYLES = StyleSheet.create({
    base: {
        overflow: 'hidden',
    },
    poster: {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        resizeMode: 'contain',
    },
    video: {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    },
});
// On a real device UIManager should be present, however when running offline tests with jest-expo
// we have to use the provided native module mock to access constants
const ExpoVideoManagerConstants = ExpoVideoManager;
const ExpoVideoViewManager = ExpoVideoManager;
class Video extends React.Component {
    _nativeRef = React.createRef();
    _onPlaybackStatusUpdate = null;
    constructor(props) {
        super(props);
        this.state = {
            showPoster: !!props.usePoster,
        };
    }
    /**
     * @hidden
     */
    setNativeProps(nativeProps) {
        const nativeVideo = this._nativeRef.current;
        if (!nativeVideo)
            throw new Error(`native video reference is not defined.`);
        nativeVideo.setNativeProps(nativeProps);
    }
    // Internal methods
    _handleNewStatus = (status) => {
        if (this.state.showPoster &&
            status.isLoaded &&
            (status.isPlaying || status.positionMillis !== 0)) {
            this.setState({ showPoster: false });
        }
        if (this.props.onPlaybackStatusUpdate) {
            this.props.onPlaybackStatusUpdate(status);
        }
        if (this._onPlaybackStatusUpdate) {
            this._onPlaybackStatusUpdate(status);
        }
    };
    _performOperationAndHandleStatusAsync = async (operation) => {
        const video = this._nativeRef.current;
        if (!video) {
            throw new Error(`Cannot complete operation because the Video component has not yet loaded`);
        }
        const handle = findNodeHandle(this._nativeRef.current);
        const status = await operation(handle);
        this._handleNewStatus(status);
        return status;
    };
    // Fullscreening API
    _setFullscreen = async (value) => {
        return this._performOperationAndHandleStatusAsync((tag) => ExpoVideoViewManager.setFullscreen(tag, value));
    };
    /**
     * This presents a fullscreen view of your video component on top of your app's UI. Note that even if `useNativeControls` is set to `false`,
     * native controls will be visible in fullscreen mode.
     * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the video once the fullscreen player has finished presenting,
     * or rejects if there was an error, or if this was called on an Android device.
     */
    presentFullscreenPlayer = async () => {
        return this._setFullscreen(true);
    };
    /**
     * This dismisses the fullscreen video view.
     * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the video once the fullscreen player has finished dismissing,
     * or rejects if there was an error, or if this was called on an Android device.
     */
    dismissFullscreenPlayer = async () => {
        return this._setFullscreen(false);
    };
    // ### Unified playback API ### (consistent with Audio.js)
    // All calls automatically call onPlaybackStatusUpdate as a side effect.
    /**
     * @hidden
     */
    getStatusAsync = async () => {
        return this._performOperationAndHandleStatusAsync((tag) => ExponentAV.getStatusForVideo(tag));
    };
    /**
     * @hidden
     */
    loadAsync = async (source, initialStatus = {}, downloadFirst = true) => {
        const { nativeSource, fullInitialStatus } = await getNativeSourceAndFullInitialStatusForLoadAsync(source, initialStatus, downloadFirst);
        return this._performOperationAndHandleStatusAsync((tag) => ExponentAV.loadForVideo(tag, nativeSource, fullInitialStatus));
    };
    /**
     * Equivalent to setting URI to `null`.
     * @hidden
     */
    unloadAsync = async () => {
        return this._performOperationAndHandleStatusAsync((tag) => ExponentAV.unloadForVideo(tag));
    };
    componentWillUnmount() {
        // Auto unload video to perform necessary cleanup safely
        this.unloadAsync().catch(() => {
            // Ignored rejection. Sometimes the unloadAsync code is executed when video is already unloaded.
            // In such cases, it throws:
            // "[Unhandled promise rejection: Error: Invalid view returned from registry,
            //  expecting EXVideo, got: (null)]"
        });
    }
    /**
     * Set status API, only available while `isLoaded = true`.
     * @hidden
     */
    setStatusAsync = async (status) => {
        assertStatusValuesInBounds(status);
        return this._performOperationAndHandleStatusAsync((tag) => ExponentAV.setStatusForVideo(tag, status));
    };
    /**
     * @hidden
     */
    replayAsync = async (status = {}) => {
        if (status.positionMillis && status.positionMillis !== 0) {
            throw new Error('Requested position after replay has to be 0.');
        }
        return this._performOperationAndHandleStatusAsync((tag) => ExponentAV.replayVideo(tag, {
            ...status,
            positionMillis: 0,
            shouldPlay: true,
        }));
    };
    /**
     * Sets a function to be called regularly with the `AVPlaybackStatus` of the playback object.
     *
     * `onPlaybackStatusUpdate` will be called whenever a call to the API for this playback object completes
     * (such as `setStatusAsync()`, `getStatusAsync()`, or `unloadAsync()`), nd will also be called at regular intervals
     * while the media is in the loaded state.
     *
     * Set `progressUpdateIntervalMillis` via `setStatusAsync()` or `setProgressUpdateIntervalAsync()` to modify
     * the interval with which `onPlaybackStatusUpdate` is called while loaded.
     *
     * @param onPlaybackStatusUpdate A function taking a single parameter `AVPlaybackStatus`.
     */
    setOnPlaybackStatusUpdate(onPlaybackStatusUpdate) {
        this._onPlaybackStatusUpdate = onPlaybackStatusUpdate;
        this.getStatusAsync();
    }
    // Methods of the Playback interface that are set via PlaybackMixin
    playAsync;
    playFromPositionAsync;
    pauseAsync;
    stopAsync;
    setPositionAsync;
    setRateAsync;
    setVolumeAsync;
    setIsMutedAsync;
    setIsLoopingAsync;
    setProgressUpdateIntervalAsync;
    // Callback wrappers
    _nativeOnPlaybackStatusUpdate = (event) => {
        this._handleNewStatus(event.nativeEvent);
    };
    // TODO make sure we are passing the right stuff
    _nativeOnLoadStart = () => {
        if (this.props.onLoadStart) {
            this.props.onLoadStart();
        }
    };
    _nativeOnLoad = (event) => {
        if (this.props.onLoad) {
            this.props.onLoad(event.nativeEvent);
        }
        this._handleNewStatus(event.nativeEvent);
    };
    _nativeOnError = (event) => {
        const error = event.nativeEvent.error;
        if (this.props.onError) {
            this.props.onError(error);
        }
        this._handleNewStatus(getUnloadedStatus(error));
    };
    _nativeOnReadyForDisplay = (event) => {
        if (this.props.onReadyForDisplay) {
            this.props.onReadyForDisplay(event.nativeEvent);
        }
    };
    _nativeOnFullscreenUpdate = (event) => {
        if (this.props.onFullscreenUpdate) {
            this.props.onFullscreenUpdate(event.nativeEvent);
        }
    };
    _renderPoster = () => {
        const PosterComponent = this.props.PosterComponent ?? Image;
        return this.props.usePoster && this.state.showPoster ? (React.createElement(PosterComponent, { style: [_STYLES.poster, this.props.posterStyle], source: this.props.posterSource })) : null;
    };
    render() {
        const source = getNativeSourceFromSource(this.props.source) || undefined;
        let nativeResizeMode = ExpoVideoManagerConstants.ScaleNone;
        if (this.props.resizeMode) {
            const resizeMode = this.props.resizeMode;
            if (resizeMode === ResizeMode.STRETCH) {
                nativeResizeMode = ExpoVideoManagerConstants.ScaleToFill;
            }
            else if (resizeMode === ResizeMode.CONTAIN) {
                nativeResizeMode = ExpoVideoManagerConstants.ScaleAspectFit;
            }
            else if (resizeMode === ResizeMode.COVER) {
                nativeResizeMode = ExpoVideoManagerConstants.ScaleAspectFill;
            }
        }
        // Set status via individual props
        const status = { ...this.props.status };
        [
            'progressUpdateIntervalMillis',
            'positionMillis',
            'shouldPlay',
            'rate',
            'shouldCorrectPitch',
            'volume',
            'isMuted',
            'isLooping',
        ].forEach((prop) => {
            if (prop in this.props) {
                status[prop] = this.props[prop];
            }
        });
        // Replace selected native props
        const nativeProps = {
            ...omit(this.props, [
                'source',
                'onPlaybackStatusUpdate',
                'usePoster',
                'posterSource',
                'posterStyle',
                ...Object.keys(status),
            ]),
            style: [_STYLES.base, this.props.style],
            videoStyle: [_STYLES.video, this.props.videoStyle],
            source,
            resizeMode: nativeResizeMode,
            status,
            onStatusUpdate: this._nativeOnPlaybackStatusUpdate,
            onLoadStart: this._nativeOnLoadStart,
            onLoad: this._nativeOnLoad,
            onError: this._nativeOnError,
            onReadyForDisplay: this._nativeOnReadyForDisplay,
            onFullscreenUpdate: this._nativeOnFullscreenUpdate,
        };
        return (React.createElement(View, { style: nativeProps.style, pointerEvents: "box-none" },
            React.createElement(ExponentVideo, { ref: this._nativeRef, ...nativeProps, style: nativeProps.videoStyle }),
            this._renderPoster()));
    }
}
function omit(props, propNames) {
    const copied = { ...props };
    for (const propName of propNames) {
        delete copied[propName];
    }
    return copied;
}
Object.assign(Video.prototype, PlaybackMixin);
// note(simek): TypeDoc cannot resolve correctly name of inline and default exported class
export default Video;
//# sourceMappingURL=Video.js.map