import * as React from 'react';
import { StyleSheet } from 'react-native';
export const FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = 0;
export const FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = 1;
export const FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = 2;
export const FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = 3;
export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = FULLSCREEN_UPDATE_PLAYER_DID_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = FULLSCREEN_UPDATE_PLAYER_DID_DISMISS;
function getStatusFromVideo(video) {
    if (!video) {
        return {
            isLoaded: false,
            error: undefined,
        };
    }
    const isPlaying = !!(video.currentTime > 0 &&
        !video.paused &&
        !video.ended &&
        video.readyState > 2);
    const status = {
        isLoaded: true,
        // androidImplementation?: string,
        uri: video.src,
        progressUpdateIntervalMillis: 100,
        durationMillis: video.duration * 1000,
        positionMillis: video.currentTime * 1000,
        // playableDurationMillis: video.buffered * 1000,
        // seekMillisToleranceBefore?: number
        // seekMillisToleranceAfter?: number
        shouldPlay: video.autoplay,
        isPlaying,
        isBuffering: false,
        rate: video.playbackRate,
        shouldCorrectPitch: false,
        volume: video.volume,
        isMuted: video.muted,
        isLooping: video.loop,
        didJustFinish: video.ended,
    };
    console.log(status);
    return status;
}
export default class ExponentVideo extends React.Component {
    constructor() {
        super(...arguments);
        this.onStatusUpdate = () => {
            if (!this.props.onStatusUpdate) {
                return;
            }
            this.props.onStatusUpdate(getStatusFromVideo(this._video));
        };
        this.onLoadStart = () => {
            if (!this.props.onLoadStart) {
                return;
            }
            this.props.onLoadStart();
            this.onStatusUpdate();
        };
        this.onLoadedData = event => {
            if (!this.props.onLoad) {
                return;
            }
            this.props.onLoad(event.nativeEvent);
            this.onStatusUpdate();
        };
        this.onError = event => {
            if (!this.props.onError) {
                return;
            }
            this.props.onError(event.nativeEvent);
            this.onStatusUpdate();
        };
        this.onProgress = () => {
            this.onStatusUpdate();
        };
        this.onSeeking = () => {
            this.onStatusUpdate();
        };
        this.onEnded = () => {
            this.onStatusUpdate();
        };
        this.onLoadedMetadata = () => {
            this.onStatusUpdate();
        };
        this.onCanPlay = ({ nativeEvent }) => {
            if (!this.props.onReadyForDisplay) {
                return;
            }
            this.props.onReadyForDisplay(nativeEvent);
            this.onStatusUpdate();
        };
        this.onStalled = () => {
            this.onStatusUpdate();
        };
        this.onRef = (ref) => {
            this._video = ref;
            this.onStatusUpdate();
        };
    }
    render() {
        const { source, status = {}, useNativeControls, style } = this.props;
        console.log('ExponentVideo', source);
        return (<video ref={this.onRef} onLoadStart={this.onLoadStart} onLoadedData={this.onLoadedData} onError={this.onError} onProgress={this.onProgress} onSeeking={this.onSeeking} onEnded={this.onEnded} onLoadedMetadata={this.onLoadedMetadata} onCanPlay={this.onCanPlay} onStalled={this.onStalled} src={(source || { uri: undefined }).uri} muted={status.isMuted} loop={status.isLooping} autoPlay={status.shouldPlay} controls={useNativeControls} style={StyleSheet.flatten(style)}/>);
    }
}
//# sourceMappingURL=ExponentVideo.web.js.map