import { ConfigPlugin } from 'expo/config-plugins';
type Font = {
    alias?: string;
    fontFamily: string;
    path: string;
};
export type FontProps = {
    fonts?: (Font | string)[];
};
declare const _default: ConfigPlugin<FontProps>;
export default _default;
