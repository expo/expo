import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, InfoPlist } from 'expo/config-plugins';
export declare const INITIAL_ORIENTATION_KEY = "EXDefaultScreenOrientationMask";
declare const OrientationLock: {
    DEFAULT: string;
    ALL: string;
    PORTRAIT: string;
    PORTRAIT_UP: string;
    PORTRAIT_DOWN: string;
    LANDSCAPE: string;
    LANDSCAPE_LEFT: string;
    LANDSCAPE_RIGHT: string;
};
type OrientationMasks = keyof typeof OrientationLock;
interface ExpoConfigWithInitialOrientation extends ExpoConfig {
    initialOrientation?: OrientationMasks;
}
export declare function getInitialOrientation(config: Pick<ExpoConfigWithInitialOrientation, 'initialOrientation'>): OrientationMasks;
export declare function setInitialOrientation(config: Pick<ExpoConfigWithInitialOrientation, 'initialOrientation'>, infoPlist: InfoPlist): InfoPlist;
declare const _default: ConfigPlugin<void | {
    initialOrientation?: "DEFAULT" | "ALL" | "PORTRAIT" | "PORTRAIT_UP" | "PORTRAIT_DOWN" | "LANDSCAPE" | "LANDSCAPE_LEFT" | "LANDSCAPE_RIGHT" | undefined;
}>;
export default _default;
