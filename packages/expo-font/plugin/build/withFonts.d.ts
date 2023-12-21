import { ConfigPlugin } from 'expo/config-plugins';
export type FontObject = {
    path: string;
    family: string;
    weight: number;
    style?: 'normal' | 'italic';
};
export type Font = string | FontObject;
export type FontProps = {
    fonts?: Font[];
};
declare const _default: ConfigPlugin<FontProps>;
export default _default;
