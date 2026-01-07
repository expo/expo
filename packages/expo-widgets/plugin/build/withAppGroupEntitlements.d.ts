import { ConfigPlugin } from 'expo/config-plugins';
interface AppGroupEntitlementsProps {
    bundleIdentifier: string;
    targetName: string;
    groupIdentifier: string;
}
declare const withAppGroupEntitlements: ConfigPlugin<AppGroupEntitlementsProps>;
export default withAppGroupEntitlements;
