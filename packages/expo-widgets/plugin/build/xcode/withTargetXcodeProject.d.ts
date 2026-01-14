import { ConfigPlugin } from 'expo/config-plugins';
type TargetXcodeProjectProps = {
    targetName: string;
    bundleIdentifier: string;
    deploymentTarget: string;
    getFileUris: () => string[];
};
declare const withTargetXcodeProject: ConfigPlugin<TargetXcodeProjectProps>;
export default withTargetXcodeProject;
