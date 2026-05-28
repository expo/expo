import { ConfigPlugin } from 'expo/config-plugins';
type withAppInfoPlistProps = {
    frequentUpdates: boolean;
    groupIdentifier: string;
};
declare const withAppInfoPlist: ConfigPlugin<withAppInfoPlistProps>;
export default withAppInfoPlist;
