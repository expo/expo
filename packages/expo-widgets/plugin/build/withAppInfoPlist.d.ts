import { ConfigPlugin } from 'expo/config-plugins';
interface withAppInfoPlistProps {
    frequentUpdates?: boolean;
    groupIdentifier: string;
}
declare const withAppInfoPlist: ConfigPlugin<withAppInfoPlistProps>;
export default withAppInfoPlist;
