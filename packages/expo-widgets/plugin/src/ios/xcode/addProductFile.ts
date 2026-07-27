import { XcodeProject } from 'expo/config-plugins';
import type { PBXFile } from 'xcode';

type AddProductFileProps = {
  targetName: string;
  groupName: string;
};

type FileReference = {
  path?: string;
  name?: string;
};

type ProductFile = PBXFile & {
  uuid: string;
  target: string;
  basename: string;
  group: string;
};

export function addProductFile(
  xcodeProject: XcodeProject,
  { targetName, groupName }: AddProductFileProps
): ProductFile {
  const basename = `${targetName}.appex`;
  const settings = { ATTRIBUTES: ['RemoveHeadersOnCopy'] };
  const fileReferenceSection = xcodeProject.pbxFileReferenceSection() as Record<
    string,
    FileReference | string | undefined
  >;
  const fileRef = Object.keys(fileReferenceSection).find((key) => {
    const fileReference = fileReferenceSection[key];
    if (!fileReference || typeof fileReference === 'string') {
      return false;
    }
    return (
      fileReference?.path === basename ||
      fileReference?.path === `"${basename}"` ||
      fileReference?.name === basename ||
      fileReference?.name === `"${basename}"`
    );
  });

  if (fileRef) {
    const buildFileSection = xcodeProject.pbxBuildFileSection();
    const uuid =
      Object.keys(buildFileSection).find((key) => {
        const buildFile = buildFileSection[key];
        return buildFile?.fileRef === fileRef;
      }) ?? xcodeProject.generateUuid();

    return {
      uuid,
      fileRef,
      sourceTree: 'BUILT_PRODUCTS_DIR',
      target: targetName,
      basename,
      group: groupName,
      settings,
    };
  }

  return xcodeProject.addProductFile(targetName, {
    basename,
    group: groupName,
    explicitFileType: 'wrapper.app-extension',
    settings,
    includeInIndex: 0,
    path: basename,
    sourceTree: 'BUILT_PRODUCTS_DIR',
  }) as ProductFile;
}
