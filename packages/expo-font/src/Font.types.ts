import type { Asset } from 'expo-asset';

// @needsAudit
/**
 * The different types of assets you can provide to the [`loadAsync()`](#loadasyncfontfamilyorfontmap-source) function.
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
export type FontSource = string | number | Asset | FontResource;

// @needsAudit
/**
 * An object used to dictate the resource that is loaded into the provided font namespace when used
 * with [`loadAsync`](#loadasyncfontfamilyorfontmap-source).
 */
export type FontResource = {
  uri?: string | number;
  /**
   * Sets the [`font-display`](#fontdisplay) property for a given typeface in the browser.
   * @platform web
   */
  display?: FontDisplay;
  default?: string;
  /**
   * Sets a custom test string passed to the [FontFace Observer](https://www.npmjs.com/package/fontfaceobserver).
   * @platform web
   */
  testString?: string;
  /**
   * Sets the `font-weight` property for a given typeface in the browser. Use this to
   * distinguish multiple weights of the same `fontFamily` loaded through [`FontFamilyDefinition`](#fontfamilydefinition).
   * @platform web
   */
  weight?: number | string;
  /**
   * Sets the `font-style` property for a given typeface in the browser. Use this to
   * distinguish italic faces of the same `fontFamily` loaded through [`FontFamilyDefinition`](#fontfamilydefinition).
   * @platform web
   */
  style?: 'normal' | 'italic' | 'oblique';
};

// @needsAudit
/**
 * A single font face that belongs to a [`FontFamilyDefinition`](#fontfamilydefinition). Use
 * `weight` and `style` to distinguish faces of the same `fontFamily`, for example the bold or
 * italic cut of a typeface.
 */
export type FontFaceDefinition = {
  /**
   * The font asset to load for this face, in any format accepted by [`FontSource`](#fontsource).
   */
  path: FontSource;
  /**
   * Maps to the CSS `font-weight` property. Has no effect on native platforms, where only the
   * first `fontDefinitions` entry of a given `fontFamily` can be loaded.
   * @default 400
   * @platform web
   */
  weight?: number | string;
  /**
   * Maps to the CSS `font-style` property. Has no effect on native platforms, where only the
   * first `fontDefinitions` entry of a given `fontFamily` can be loaded.
   * @default 'normal'
   * @platform web
   */
  style?: 'normal' | 'italic' | 'oblique';
  /**
   * Sets the [`font-display`](#fontdisplay) property for this face in the browser.
   * @platform web
   */
  display?: FontDisplay;
  /**
   * Sets a custom test string passed to the [FontFace Observer](https://www.npmjs.com/package/fontfaceobserver) for this face.
   * @platform web
   */
  testString?: string;
};

// @needsAudit
/**
 * Groups one or more [`FontFaceDefinition`](#fontfacedefinition)s under a single `fontFamily`
 * name. Use this to load multiple weights or styles (for example regular, bold, and italic) of
 * the same typeface so the browser can select the correct face with the CSS `font-weight` and
 * `font-style` properties.
 */
export type FontFamilyDefinition = {
  /**
   * The name used as the `fontFamily` [style prop](https://reactnative.dev/docs/text#style)
   * with React Native `Text` elements.
   */
  fontFamily: string;
  /**
   * The faces (for example different weights or styles) that make up `fontFamily`.
   */
  fontDefinitions: FontFaceDefinition[];
};

// @needsAudit
/**
 * Sets the [font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
 * for a given typeface. The default font value on web is `FontDisplay.AUTO`.
 * Even though setting the `fontDisplay` does nothing on native platforms, the default behavior
 * emulates `FontDisplay.SWAP` on flagship devices like iOS, Samsung, Pixel, etc. Default
 * functionality varies on One Plus devices. In the browser this value is set in the generated
 * `@font-face` CSS block and not as a style property meaning you cannot dynamically change this
 * value based on the element it's used in.
 * @platform web
 */
export enum FontDisplay {
  /**
   * __(Default)__ The font display strategy is defined by the user agent or platform.
   * This generally defaults to the text being invisible until the font is loaded.
   * Good for buttons or banners that require a specific treatment.
   */
  AUTO = 'auto',
  /**
   * Fallback text is rendered immediately with a default font while the desired font is loaded.
   * This is good for making the content appear to load instantly and is usually preferred.
   */
  SWAP = 'swap',
  /**
   * The text will be invisible until the font has loaded. If the font fails to load then nothing
   * will appear - it's best to turn this off when debugging missing text.
   */
  BLOCK = 'block',
  /**
   * Splits the behavior between `SWAP` and `BLOCK`.
   * There will be a [100ms timeout](https://developers.google.com/web/updates/2016/02/font-display?hl=en)
   * where the text with a custom font is invisible, after that the text will either swap to the
   * styled text or it'll show the unstyled text and continue to load the custom font. This is good
   * for buttons that need a custom font but should also be quickly available to screen-readers.
   */
  FALLBACK = 'fallback',
  /**
   * This works almost identically to `FALLBACK`, the only difference is that the browser will
   * decide to load the font based on slow connection speed or critical resource demand.
   */
  OPTIONAL = 'optional',
}

// @needsAudit
/**
 * Object used to query fonts for unloading.
 * @hidden
 */
export type UnloadFontOptions = Pick<FontResource, 'display' | 'weight' | 'style'>;

// @needsAudit
/**
 * The value accepted by [`useFonts`](#usefontsmap) and [`loadAsync`](#loadasyncfontfamilyorfontmap-source):
 * a single `fontFamily` name, a map of `fontFamily` names to [`FontSource`](#fontsource)s, or an
 * array of [`FontFamilyDefinition`](#fontfamilydefinition)s for loading multiple faces per family.
 */
export type FontMap = string | Record<string, FontSource> | FontFamilyDefinition[];

export type UseFontHook = (map: FontMap) => [boolean, Error | null];

export type ServerFontResourceDescriptor =
  | {
      type: 'style';
      css: string;
      id: string;
    }
  | {
      type: 'link';
      as: 'font';
      crossOrigin?: 'anonymous' | 'use-credentials' | '' | undefined;
      href: string;
      rel: 'preload';
    };
