import { Platform, UnavailabilityError } from 'expo-modules-core';
import React from 'react';
import { Image as ReactNativeImage, StyleSheet, } from 'react-native';
import ExpoImage, { ExpoImageModule } from './ExpoImage';
const DEFAULT_RESIZE_MODE = 'cover';
export default class Image extends React.Component {
    static getDerivedStateFromProps(props) {
        return {
            onLoad: props.onLoadEnd
                ? (e) => {
                    if (props.onLoad) {
                        props.onLoad(e);
                    }
                    props.onLoadEnd();
                }
                : props.onLoad,
            onError: props.onLoadEnd
                ? (e) => {
                    if (props.onError) {
                        props.onError(e);
                    }
                    props.onLoadEnd();
                }
                : props.onError,
        };
    }
    /**
     * **Available on @Android only.** Caching the image that can be later used in ImageView
     * @return an empty promise.
     */
    static async prefetch(url) {
        if (Platform.OS !== 'android') {
            throw new UnavailabilityError('Image', 'prefetch');
        }
        return await ExpoImageModule.prefetch(url);
    }
    /**
     * Resolves an asset reference into an object which has the properties `uri`, `width` and `height`
     *
     * @param source A number (opaque type returned by require('./foo.png')) or an `ImageSource`.
     *
     * @return an object constaining `uri` `width` and `height`.
     */
    static resolveAssetSource(source) {
        return ReactNativeImage.resolveAssetSource(source);
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