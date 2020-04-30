import { project as PBXProject, UUID } from 'xcode';
/**
 * @param filePath
 * @param param1.target PBXNativeTarget reference
 * @param param1.group PBXGroup reference
 */
export declare function addStoryboardFileToProject(pbxProject: PBXProject, filePath: string, { target, group }: {
    target: UUID;
    group: UUID;
}): void;
