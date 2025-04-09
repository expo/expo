import { type ConfigPlugin } from 'expo/config-plugins';
export type FontFiles = {
    font: string;
    fontStyle: 'normal' | 'italic';
    fontWeight: `${number}`;
};
export type XmlFonts = {
    files: FontFiles[];
    fontName: string;
};
export declare const withFontsAndroid: ConfigPlugin<string[]>;
export declare const withXmlFontsAndroid: ConfigPlugin<XmlFonts[]>;
