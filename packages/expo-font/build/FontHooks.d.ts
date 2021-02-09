import { FontSource } from './Font.types';
/**
 * Load a map of custom fonts to use in textual elements.
 * The map keys are used as font names, and can be used with `fontFamily: <name>;`.
 * It returns a boolean describing if all fonts are loaded.
 *
 * Note, the fonts are not "reloaded" when you dynamically change the font map.
 *
 * @see https://docs.expo.io/versions/latest/sdk/font/
 * @example const [loaded, error] = useFonts(...);
 */
export declare function useFonts(map: string | {
    [fontFamily: string]: FontSource;
}): [boolean, Error | null];
