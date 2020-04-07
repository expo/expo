import { project, UUID } from 'xcode';

class PBXProject extends project {
  /**
   * @param filePath
   * @param param1.target PBXNativeTarget reference
   * @param param1.group PBXGroup reference
   */
  addStoryboardFile(filePath: string, { target, group }: { target: UUID; group: UUID }) {
    const file = this.addFile(filePath, undefined, {
      lastKnownFileType: 'file.storyboard',
      defaultEncoding: 4,
      target,
    });
    if (!file) {
      throw new Error('File already exists in the project');
    }
    delete this.pbxFileReferenceSection()[file.fileRef].explicitFileType;
    delete this.pbxFileReferenceSection()[file.fileRef].includeInIndex;

    file.uuid = this.generateUuid();
    file.target = target;

    this.addToPbxBuildFileSection(file);
    this.addToPbxResourcesBuildPhase(file);
    this.addToPbxGroup(file, group);
  }
}

export { PBXProject as project };
