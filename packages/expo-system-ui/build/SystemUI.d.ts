import { ColorValue } from 'react-native';
/**
 * Changes the root view background color.
 * Call this function in the root file outside of you component.
 *
 * @example
 * ```ts
 * SystemUI.setBackgroundColorAsync("black");
 * ```
 * @param color Any valid [CSS 3 (SVG) color](http://www.w3.org/TR/css3-color/#svg-color).
 */
export declare function setBackgroundColorAsync(color: ColorValue | null): Promise<void>;
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
//# sourceMappingURL=SystemUI.d.ts.map