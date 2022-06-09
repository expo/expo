import * as React from 'react';
import createElement from 'react-native-web/dist/exports/createElement';
import ExponentAV from './ExponentAV';
import { addFullscreenListener } from './FullscreenUtils.web';
import { VideoFullscreenUpdate, } from './Video.types';
const Video = React.forwardRef((props, ref) => createElement('video', { ...props, ref }));
export default class ExponentVideo extends React.Component {
    _video;
    _removeFullscreenListener;
    componentWillUnmount() {
        this._removeFullscreenListener?.();
    }
    onFullscreenChange = (isFullscreen) => {
        if (!this.props.onFullscreenUpdate)
            return;
        if (isFullscreen) {
            this.props.onFullscreenUpdate({
                nativeEvent: { fullscreenUpdate: VideoFullscreenUpdate.PLAYER_DID_PRESENT },
            });
        }
        else {
            this.props.onFullscreenUpdate({
                nativeEvent: { fullscreenUpdate: VideoFullscreenUpdate.PLAYER_DID_DISMISS },
            });
        }
    };
    onStatusUpdate = async () => {
        if (!this.props.onStatusUpdate) {
            return;
        }
        const nativeEvent = await ExponentAV.getStatusForVideo(this._video);
        this.props.onStatusUpdate({ nativeEvent });
    };
    onLoadStart = () => {
        if (!this.props.onLoadStart) {
            return;
        }
        this.props.onLoadStart();
        this.onStatusUpdate();
    };
    onLoadedData = (event) => {
        if (!this.props.onLoad) {
            return;
        }
        this.props.onLoad(event);
        this.onStatusUpdate();
    };
    onError = (event) => {
        if (!this.props.onError) {
            return;
        }
        this.props.onError(event);
        this.onStatusUpdate();
    };
    onProgress = () => {
        this.onStatusUpdate();
    };
    onSeeking = () => {
        this.onStatusUpdate();
    };
    onEnded = () => {
        this.onStatusUpdate();
    };
    onLoadedMetadata = () => {
        this.onStatusUpdate();
    };
    onCanPlay = (event) => {
        if (!this.props.onReadyForDisplay) {
            return;
        }
        this.props.onReadyForDisplay(event);
        this.onStatusUpdate();
    };
    onStalled = () => {
        this.onStatusUpdate();
    };
    onRef = (ref) => {
        this._removeFullscreenListener?.();
        if (ref) {
            this._video = ref;
            this._removeFullscreenListener = addFullscreenListener(this._video, this.onFullscreenChange);
            this.onStatusUpdate();
        }
        else {
            this._removeFullscreenListener = undefined;
        }
    };
    render() {
        const { source, status = {}, resizeMode: objectFit, useNativeControls, style } = this.props;
        const customStyle = {
            position: undefined,
            objectFit,
            overflow: 'hidden',
        };
        return (React.createElement(Video, { ref: this.onRef, onLoadStart: this.onLoadStart, onLoadedData: this.onLoadedData, onError: this.onError, onTimeUpdate: this.onProgress, onSeeking: this.onSeeking, onEnded: this.onEnded, onLoadedMetadata: this.onLoadedMetadata, onCanPlay: this.onCanPlay, onStalled: this.onStalled, src: source?.uri || undefined, muted: status.isMuted, loop: status.isLooping, autoPlay: status.shouldPlay, controls: useNativeControls, style: [style, customStyle], playsInline: true }));
    }
}
//# sourceMappingURL=ExponentVideo.web.js.map