import { ConfigPlugin } from 'expo/config-plugins';
type AppGroupEntitlementsProps = {
    groupIdentifier: string;
};
declare const withAppGroupEntitlements: ConfigPlugin<AppGroupEntitlementsProps>;
export default withAppGroupEntitlements;
