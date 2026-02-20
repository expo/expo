import { ConfigPlugin } from 'expo/config-plugins';
type EasConfigProps = {
    targetName: string;
    bundleIdentifier: string;
    groupIdentifier: string;
};
declare const withEasConfig: ConfigPlugin<EasConfigProps>;
export default withEasConfig;
