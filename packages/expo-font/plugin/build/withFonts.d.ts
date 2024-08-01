import { type ConfigPlugin } from 'expo/config-plugins';
export type FontProps = {
    fonts?: string[];
    android?: {
        fonts?: string[];
    };
    ios?: {
        fonts?: string[];
    };
};
declare const _default: ConfigPlugin<FontProps>;
export default _default;
