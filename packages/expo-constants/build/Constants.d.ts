import { AndroidManifest, AppOwnership, IOSManifest, PlatformManifest, NativeConstants, UserInterfaceIdiom, WebManifest } from './Constants.types';
export { AppOwnership, UserInterfaceIdiom, PlatformManifest, NativeConstants, IOSManifest, AndroidManifest, WebManifest, };
export interface Constants extends NativeConstants {
    deviceId?: string;
    linkingUrl?: string;
}
declare const _default: Constants;
export default _default;
