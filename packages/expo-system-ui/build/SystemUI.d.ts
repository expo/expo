import { ColorValue } from 'react-native';
/**
 * Changes the root view background color.
 *
 * @example
 * ```ts
 * SystemUI.setBackgroundColorAsync("white");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export declare function setBackgroundColorAsync(color: ColorValue): Promise<void>;
/**
 * Gets the root view background color.
 *
 * @example
 * ```ts
 * const color = await SystemUI.getBackgroundColorAsync();
 * ```
 * @returns Current root view background color in hex format. Returns `null` if the background color is not set.
 */
export declare function getBackgroundColorAsync(): Promise<ColorValue | null>;
/**
 * Restores the root view background color.
 * Call this function in your apps root component to restore the most recently set background color.
 *
 * @example
 * ```ts
 * await SystemUI.restoreBackgroundColorAsync();
 * ```
 * @platform android
 */
export declare function restoreBackgroundColorAsync(): Promise<void>;
//# sourceMappingURL=SystemUI.d.ts.map