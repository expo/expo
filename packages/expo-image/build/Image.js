import React from 'react';
import { StyleSheet } from 'react-native';
import ExpoImage, { ExpoImageModule } from './ExpoImage';
import { resolveContentFit, resolveContentPosition, resolveTransition } from './utils';
import { resolveSources } from './utils/resolveSources';
let loggedDefaultSourceDeprecationWarning = false;
export class Image extends React.PureComponent {
    /**
     * Preloads images at the given urls that can be later used in the image view.
     * Preloaded images are always cached on the disk, so make sure to use
     * `disk` (default) or `memory-disk` cache policy.
     */
    static prefetch(urls) {
        return ExpoImageModule.prefetch(Array.isArray(urls) ? urls : [urls]);
    }
    /**
     * Asynchronously clears all images stored in memory.
     * @return A promise resolving to `true` when the operation succeeds.
     * It may resolve to `false` on Android when the activity is no longer available.
     */
    static async clearMemoryCache() {
        return await ExpoImageModule.clearMemoryCache();
    }
    /**
     * Asynchronously clears all images from the disk cache.
     * @return A promise resolving to `true` when the operation succeeds.
     * It may resolve to `false` on Android when the activity is no longer available.
     */
    static async clearDiskCache() {
        return await ExpoImageModule.clearDiskCache();
    }
    render() {
        const { style, source, placeholder, contentFit, contentPosition, transition, fadeDuration, resizeMode: resizeModeProp, defaultSource, loadingIndicatorSource, ...restProps } = this.props;
        const { resizeMode: resizeModeStyle, ...restStyle } = StyleSheet.flatten(style) || {};
        const resizeMode = resizeModeProp ?? resizeModeStyle;
        if ((defaultSource || loadingIndicatorSource) && !loggedDefaultSourceDeprecationWarning) {
            console.warn('[expo-image]: `defaultSource` and `loadingIndicatorSource` props are deprecated, use `placeholder` instead');
            loggedDefaultSourceDeprecationWarning = true;
        }
        return (React.createElement(ExpoImage, { ...restProps, style: restStyle, source: resolveSources(source), placeholder: resolveSources(placeholder ?? defaultSource ?? loadingIndicatorSource), contentFit: resolveContentFit(contentFit, resizeMode), contentPosition: resolveContentPosition(contentPosition), transition: resolveTransition(transition, fadeDuration) }));
    }
}
//# sourceMappingURL=Image.js.map