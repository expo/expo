import { type ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withFontsAndroid } from './withFontsAndroid';
import { withFontsIos } from './withFontsIos';

const pkg = require('../../package.json');

/**
 * The five axes the OpenType registry names, or any other four-character tag
 * (a font may declare custom axes of its own, such as `GRAD`).
 */
export type FontVariationAxisTag = 'ital' | 'opsz' | 'slnt' | 'wdth' | 'wght' | (string & {});

export type FontVariationAxes = Partial<Record<FontVariationAxisTag, number>>;

export type FontDefinition = {
  /**
   * For static fonts, each definition can point to a different font file.
   */
  path?: string | undefined;
  weight: number;
  style?: 'normal' | 'italic' | undefined;
  /**
   * The axes to instance a variable font at, such as `{ slnt: -10 }` for an oblique.
   *
   * `weight` and `style` pick which face the `fontWeight` and `fontStyle` JS props match; the axes
   * here draw it. You may set them apart: `weight: 700` with `{ wght: 650 }`
   * matches a request for bold and draws the file at 650. `wght` defaults to `weight`.
   *
   * `style` alone does not slant the glyphs, so an upright file declared `style: "italic"` renders
   * upright until `slnt` or `ital` is set here.
   *
   * @platform android
   */
  axes?: FontVariationAxes | undefined;
};

export type FontObject = {
  fontFamily: string;
  /**
   * One variable font file can back several definitions; provide the file path once instead of repeating it per-definition.
   *
   * @platform android
   */
  path?: string | undefined;
  fontDefinitions: FontDefinition[];
};

export type Font = string | FontObject;

export type FontProps = {
  /**
   * An array of font file paths to link to the native project, relative to the project root.
   */
  fonts?: string[];
  android?: {
    /**
     * An array of font definitions to link on Android. Supports object syntax for xml fonts with custom family name.
     */
    fonts?: Font[];
  };
  ios?: {
    /**
     * An array of font file paths to link on iOS. The font family name is taken from the font file.
     */
    fonts?: string[];
  };
};

const withFonts: ConfigPlugin<FontProps> = (config, props) => {
  if (!props) {
    return config;
  }

  const iosFonts = [...(props.fonts ?? []), ...(props.ios?.fonts ?? [])];

  if (iosFonts.length > 0) {
    config = withFontsIos(config, iosFonts);
  }

  const androidFonts = [...(props.fonts ?? []), ...(props.android?.fonts ?? [])];

  if (androidFonts.length > 0) {
    config = withFontsAndroid(config, androidFonts);
  }

  return config;
};

export default createRunOncePlugin(withFonts, pkg.name, pkg.version);
