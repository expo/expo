import { XcodeProject } from 'expo/config-plugins';
interface AddXCConfigurationListProps {
    targetName: string;
    currentProjectVersion: string;
    bundleIdentifier: string;
    deploymentTarget: string;
    marketingVersion?: string;
}
export declare function addXCConfigurationList(xcodeProject: XcodeProject, props: AddXCConfigurationListProps): any;
export {};
