import { type ConfigPlugin } from 'expo/config-plugins';
export type XmlFonts = {
    fontFiles?: string[];
    fontName?: string;
};
export declare const withFontsAndroid: ConfigPlugin<string[]>;
export declare const withXmlFontsAndroid: ConfigPlugin<XmlFonts[]>;
