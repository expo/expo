import { project as PBXProject, UUID } from 'xcode';

/**
 * @param filePath
 * @param param1.target PBXNativeTarget reference
 * @param param1.group PBXGroup reference
 */
export function addStoryboardFileToProject(
  pbxProject: PBXProject,
  filePath: string,
  { target, group }: { target: UUID; group: UUID }
) {
  const file = pbxProject.addFile(filePath, undefined, {
    lastKnownFileType: 'file.storyboard',
    defaultEncoding: 4,
    target,
  });
  if (!file) {
    throw new Error('File already exists in the project');
  }
  delete pbxProject.pbxFileReferenceSection()[file.fileRef].explicitFileType;
  delete pbxProject.pbxFileReferenceSection()[file.fileRef].includeInIndex;

  file.uuid = pbxProject.generateUuid();
  file.target = target;

  pbxProject.addToPbxBuildFileSection(file);
  pbxProject.addToPbxResourcesBuildPhase(file);
  pbxProject.addToPbxGroup(file, group);
}
