import { ConfigPlugin } from 'expo/config-plugins';
export type WithLocationProps = {
    locationAlwaysAndWhenInUsePermission?: string | false;
    locationAlwaysPermission?: string | false;
    locationWhenInUsePermission?: string | false;
    isIosBackgroundLocationEnabled?: boolean;
    isAndroidBackgroundLocationEnabled?: boolean;
    isAndroidForegroundServiceEnabled?: boolean;
};
declare const _default: ConfigPlugin<void | WithLocationProps>;
export default _default;
