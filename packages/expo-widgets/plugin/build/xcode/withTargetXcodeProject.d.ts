import { ConfigPlugin } from 'expo/config-plugins';
interface TargetXcodeProjectProps {
    targetName: string;
    targetBundleIdentifier: string;
    deploymentTarget: string;
    getFileUris: () => string[];
}
declare const withTargetXcodeProject: ConfigPlugin<TargetXcodeProjectProps>;
export default withTargetXcodeProject;
