import { type ConfigPlugin } from 'expo/config-plugins';
export type WithFontProps = {
    fonts?: string[];
    android?: {
        fonts?: string[];
    };
    ios?: {
        fonts?: string[];
    };
};
/**
 * @deprecated Use `WithFontProps` instead.
 */
export type FontProps = WithFontProps;
declare const _default: ConfigPlugin<void | WithFontProps>;
export default _default;
