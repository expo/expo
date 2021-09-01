import { UnavailabilityError } from 'expo-modules-core';
import React from 'react';
import { StyleSheet, } from 'react-native';
import ExpoImage, { ExpoImageModule } from './ExpoImage';
const DEFAULT_RESIZE_MODE = 'cover';
let _requestId = 1;
function generateRequestId() {
    return _requestId++;
}
export default class Image extends React.Component {
    static getDerivedStateFromProps(props) {
        return {
            onLoad: props.onLoadEnd
                ? e => {
                    if (props.onLoad) {
                        props.onLoad(e);
                    }
                    props.onLoadEnd();
                }
                : props.onLoad,
            onError: props.onLoadEnd
                ? e => {
                    if (props.onError) {
                        props.onError(e);
                    }
                    props.onLoadEnd();
                }
                : props.onError,
        };
    }
    /**
     * **Available on @Android only.** Caches the image that can be later used in ImageView
     *
     * @param url The remote location of the image.
     *
     * @param callback The function that will be called with the `requestId`. Callback is executed before starting prefetching.
     * You can use `abortPrefetch` only after prefetching started.
     *
     * @return an empty promise.
     */
    static async prefetch(url, callback) {
        if (!ExpoImageModule.abortPrefetch) {
            throw new UnavailabilityError('Image', 'prefetch');
        }
        const requestId = generateRequestId();
        callback && callback(requestId);
        return await ExpoImageModule.prefetch(url, requestId);
    }
    /**
     * **Available on @Android only.** Aborts prefetching the image.
     *
     * @param requestId Number which is returned in `prefetch` callback.
     *
     */
    static abortPrefetch(requestId) {
        if (!ExpoImageModule.abortPrefetch) {
            throw new UnavailabilityError('Image', 'abortPrefetch');
        }
        ExpoImageModule.abortPrefetch(requestId);
    }
    state = {
        onLoad: undefined,
        onError: undefined,
    };
    render() {
        const { style, resizeMode: resizeModeProp, ...restProps } = this.props;
        const { resizeMode: resizeModeStyle, ...restStyle } = StyleSheet.flatten([style]) || {};
        const resizeMode = resizeModeProp ?? resizeModeStyle ?? DEFAULT_RESIZE_MODE;
        return (React.createElement(ExpoImage, { ...restProps, style: restStyle, resizeMode: resizeMode, onLoad: this.state.onLoad, onError: this.state.onError }));
    }
}
//# sourceMappingURL=Image.js.map