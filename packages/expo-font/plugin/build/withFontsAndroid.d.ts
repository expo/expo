import { type ConfigPlugin } from 'expo/config-plugins';
import type { Font, FontObject } from './withFonts';
export declare const withFontsAndroid: ConfigPlugin<Font[]>;
type GroupedFontObject = Record<string, FontObject['fontDefinitions']>;
export declare function groupByFamily(array: FontObject[]): GroupedFontObject;
export declare function getXmlSpecs(fontsDir: string, xmlFontObjects: GroupedFontObject): {
    path: string;
    xml: {
        'font-family': {
            $: {
                'xmlns:app': string;
            };
            font: {
                $: {
                    'app:font': string;
                    'app:fontStyle': "normal" | "italic";
                    'app:fontWeight': string;
                };
            }[];
        };
    };
}[];
export declare function generateFontManagerCalls(xmlFontObjects: GroupedFontObject, language: 'java' | 'kt'): string[];
export {};
