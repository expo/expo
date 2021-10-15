import * as React from 'react';
import { findNodeHandle, Image, StyleSheet, View } from 'react-native';
import { assertStatusValuesInBounds, getNativeSourceAndFullInitialStatusForLoadAsync, getNativeSourceFromSource, getUnloadedStatus, PlaybackMixin, } from './AV';
import ExpoVideoManager from './ExpoVideoManager';
import ExponentAV from './ExponentAV';
import ExponentVideo from './ExponentVideo';
import { ResizeMode, } from './Video.types';
export { ResizeMode, };
export const FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = 0;
export const FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = 1;
export const FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = 2;
export const FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = 3;
export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = FULLSCREEN_UPDATE_PLAYER_DID_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = FULLSCREEN_UPDATE_PLAYER_DID_DISMISS;
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
export default class Video extends React.Component {
    static RESIZE_MODE_CONTAIN = ResizeMode.CONTAIN;
    static RESIZE_MODE_COVER = ResizeMode.COVER;
    static RESIZE_MODE_STRETCH = ResizeMode.STRETCH;
    static IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT;
    static IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT;
    static IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS;
    static IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS;
    static FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT;
    static FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = FULLSCREEN_UPDATE_PLAYER_DID_PRESENT;
    static FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS;
    static FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = FULLSCREEN_UPDATE_PLAYER_DID_DISMISS;
    _nativeRef = React.createRef();
    _onPlaybackStatusUpdate = null;
    // componentOrHandle: null | number | React.Component<any, any> | React.ComponentClass<any>
    constructor(props) {
        super(props);
        this.state = {
            showPoster: !!props.usePoster,
        };
    }
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
    // ### iOS Fullscreening API ###
    _setFullscreen = async (value) => {
        return this._performOperationAndHandleStatusAsync((tag) => ExpoVideoViewManager.setFullscreen(tag, value));
    };
    presentFullscreenPlayer = async () => {
        return this._setFullscreen(true);
    };
    presentIOSFullscreenPlayer = () => {
        console.warn("You're using `presentIOSFullscreenPlayer`. Please migrate your code to use `presentFullscreenPlayer` instead.");
        return this.presentFullscreenPlayer();
    };
    presentFullscreenPlayerAsync = async () => {
        return await this.presentFullscreenPlayer();
    };
    dismissFullscreenPlayer = async () => {
        return this._setFullscreen(false);
    };
    dismissIOSFullscreenPlayer = () => {
        console.warn("You're using `dismissIOSFullscreenPlayer`. Please migrate your code to use `dismissFullscreenPlayer` instead.");
        this.dismissFullscreenPlayer();
    };
    // ### Unified playback API ### (consistent with Audio.js)
    // All calls automatically call onPlaybackStatusUpdate as a side effect.
    // Get status API
    getStatusAsync = async () => {
        return this._performOperationAndHandleStatusAsync((tag) => ExponentAV.getStatusForVideo(tag));
    };
    // Loading / unloading API
    loadAsync = async (source, initialStatus = {}, downloadFirst = true) => {
        const { nativeSource, fullInitialStatus } = await getNativeSourceAndFullInitialStatusForLoadAsync(source, initialStatus, downloadFirst);
        return this._performOperationAndHandleStatusAsync((tag) => ExponentAV.loadForVideo(tag, nativeSource, fullInitialStatus));
    };
    // Equivalent to setting URI to null.
    unloadAsync = async () => {
        return this._performOperationAndHandleStatusAsync((tag) => ExponentAV.unloadForVideo(tag));
    };
    // Set status API (only available while isLoaded = true)
    setStatusAsync = async (status) => {
        assertStatusValuesInBounds(status);
        return this._performOperationAndHandleStatusAsync((tag) => ExponentAV.setStatusForVideo(tag, status));
    };
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
    // ### Callback wrappers ###
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
        if (this.props.onIOSFullscreenUpdate && this.props.onFullscreenUpdate) {
            console.warn("You've supplied both `onIOSFullscreenUpdate` and `onFullscreenUpdate`. You're going to receive updates on both the callbacks.");
        }
        else if (this.props.onIOSFullscreenUpdate) {
            console.warn("You're using `onIOSFullscreenUpdate`. Please migrate your code to use `onFullscreenUpdate` instead.");
        }
        if (this.props.onIOSFullscreenUpdate) {
            this.props.onIOSFullscreenUpdate(event.nativeEvent);
        }
        if (this.props.onFullscreenUpdate) {
            this.props.onFullscreenUpdate(event.nativeEvent);
        }
    };
    _renderPoster = () => this.props.usePoster && this.state.showPoster ? (React.createElement(Image, { style: [_STYLES.poster, this.props.posterStyle], source: this.props.posterSource })) : null;
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
            style: StyleSheet.flatten([_STYLES.base, this.props.style]),
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
            React.createElement(ExponentVideo, { ref: this._nativeRef, ...nativeProps, style: _STYLES.video }),
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
//# sourceMappingURL=Video.js.map