import { AndroidManifest, AppOwnership, IOSManifest, NativeConstantsInterface, UserInterfaceIdiom, WebManifest } from './Constants.types';
export { AppOwnership, UserInterfaceIdiom, IOSManifest, AndroidManifest, WebManifest };
export interface ConstantsInterface extends NativeConstantsInterface {
    deviceId?: string;
    linkingUrl?: string;
}
declare const _default: ConstantsInterface;
export default _default;
