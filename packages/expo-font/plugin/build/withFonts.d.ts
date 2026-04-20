import { type ConfigPlugin } from 'expo/config-plugins';
export type FontObject = {
    fontFamily: string;
    fontDefinitions: {
        path: string;
        weight: number;
        style?: 'normal' | 'italic' | undefined;
    }[];
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
declare const _default: ConfigPlugin<FontProps>;
export default _default;
