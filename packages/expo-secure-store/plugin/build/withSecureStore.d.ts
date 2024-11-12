import { ConfigPlugin } from 'expo/config-plugins';
export type WithSecureStoreProps = {
    faceIDPermission?: string | false;
    configureAndroidBackup?: boolean;
};
declare const _default: ConfigPlugin<void | WithSecureStoreProps>;
export default _default;
