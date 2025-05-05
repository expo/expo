import { UnavailabilityError } from 'expo-modules-core';
import { processColor } from 'react-native';
import ExpoFontUtils from './ExpoFontUtils';
/**
 * Creates an image with provided text.
 * @param glyphs Text to be exported.
 * @param options RenderToImageOptions.
 * @return Promise which fulfils with uri to image.
 * @platform android
 * @platform ios
 */
export async function renderToImageAsync(glyphs, options) {
    if (!ExpoFontUtils) {
        throw new UnavailabilityError('expo-font', 'ExpoFontUtils.renderToImageAsync');
    }
    return await ExpoFontUtils.renderToImageAsync(glyphs, {
        ...options,
        color: options?.color ? processColor(options.color) : undefined,
    });
}
//# sourceMappingURL=FontUtils.js.map