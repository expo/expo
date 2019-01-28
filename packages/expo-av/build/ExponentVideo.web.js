import * as React from 'react';
import { StyleSheet } from 'react-native';
import ExponentAV from './ExponentAV';
export const FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = 0;
export const FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = 1;
export const FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = 2;
export const FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = 3;
export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = FULLSCREEN_UPDATE_PLAYER_DID_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = FULLSCREEN_UPDATE_PLAYER_DID_DISMISS;
export default class ExponentVideo extends React.Component {
    constructor() {
        super(...arguments);
        this.onStatusUpdate = async () => {
            if (!this.props.onStatusUpdate) {
                return;
            }
            const nativeEvent = await ExponentAV.getStatusForVideo(this._video);
            this.props.onStatusUpdate({ nativeEvent });
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
            this.props.onLoad(event);
            this.onStatusUpdate();
        };
        this.onError = event => {
            if (!this.props.onError) {
                return;
            }
            this.props.onError(event);
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
        this.onCanPlay = event => {
            if (!this.props.onReadyForDisplay) {
                return;
            }
            this.props.onReadyForDisplay(event);
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
        const { source, status = {}, resizeMode: objectFit, useNativeControls, style } = this.props;
        const customStyle = {
            position: undefined,
            objectFit,
            overflow: 'hidden',
        };
        const finalStyle = StyleSheet.flatten([style, customStyle]);
        return (<video ref={this.onRef} onLoadStart={this.onLoadStart} onLoadedData={this.onLoadedData} onError={this.onError} onTimeUpdate={this.onProgress} onSeeking={this.onSeeking} onEnded={this.onEnded} onLoadedMetadata={this.onLoadedMetadata} onCanPlay={this.onCanPlay} onStalled={this.onStalled} src={(source || { uri: undefined }).uri} muted={status.isMuted} loop={status.isLooping} autoPlay={status.shouldPlay} controls={useNativeControls} style={finalStyle}/>);
    }
}
//# sourceMappingURL=ExponentVideo.web.js.map