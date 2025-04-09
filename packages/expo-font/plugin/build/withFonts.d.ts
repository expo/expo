import { type ConfigPlugin } from 'expo/config-plugins';
import { type XmlFonts } from './withFontsAndroid';
export type FontProps = {
    fonts?: string[];
    android?: {
        fonts?: (string | XmlFonts)[];
    };
    ios?: {
        fonts?: string[];
    };
};
declare const _default: ConfigPlugin<FontProps>;
export default _default;
