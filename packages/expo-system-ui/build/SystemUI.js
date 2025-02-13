import { Platform, processColor } from 'react-native';
import ExpoSystemUI from './ExpoSystemUI';
/**
 * Changes the root view background color.
 * Call this function in the root file outside of your component.
 *
 * @example
 * ```ts
 * SystemUI.setBackgroundColorAsync("black");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export async function setBackgroundColorAsync(color) {
    if (color == null) {
        return await ExpoSystemUI.setBackgroundColorAsync(null);
    }
    else {
        const colorNumber = Platform.OS === 'web' ? color : processColor(color);
        return await ExpoSystemUI.setBackgroundColorAsync(colorNumber);
    }
}
/**
 * Gets the root view background color.
 *
 * @example
 * ```ts
 * const color = await SystemUI.getBackgroundColorAsync();
 * ```
 * @returns Current root view background color in hex format. Returns `null` if the background color is not set.
 */
export async function getBackgroundColorAsync() {
    return await ExpoSystemUI.getBackgroundColorAsync();
}
//# sourceMappingURL=SystemUI.js.map