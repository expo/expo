import { ConfigPlugin } from '@expo/config-plugins';
export declare function modifyObjcAppDelegate(contents: string, mask: string): string;
declare const _default: ConfigPlugin<void | {
    initialOrientation?: "DEFAULT" | "ALL" | "PORTRAIT" | "PORTRAIT_UP" | "PORTRAIT_DOWN" | "LANDSCAPE" | "LANDSCAPE_LEFT" | "LANDSCAPE_RIGHT" | undefined;
}>;
export default _default;
