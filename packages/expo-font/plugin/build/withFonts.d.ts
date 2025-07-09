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
    fonts?: string[];
    android?: {
        fonts?: Font[];
    };
    ios?: {
        fonts?: string[];
    };
};
declare const _default: ConfigPlugin<FontProps>;
export default _default;
