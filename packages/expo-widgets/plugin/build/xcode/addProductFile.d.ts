import { XcodeProject } from 'expo/config-plugins';
interface AddProductFileProps {
    targetName: string;
    groupName: string;
}
export declare function addProductFile(xcodeProject: XcodeProject, { targetName, groupName }: AddProductFileProps): any;
export {};
