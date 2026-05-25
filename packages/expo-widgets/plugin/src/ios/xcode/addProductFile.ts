import { XcodeProject } from 'expo/config-plugins';

type AddProductFileProps = {
  targetName: string;
  groupName: string;
};

export function addProductFile(
  xcodeProject: XcodeProject,
  { targetName, groupName }: AddProductFileProps
) {
  const basename = `${targetName}.appex`;
  const settings = { ATTRIBUTES: ['RemoveHeadersOnCopy'] };
  const fileReferenceSection = xcodeProject.pbxFileReferenceSection();
  const fileRef = Object.keys(fileReferenceSection).find((key) => {
    const fileReference = fileReferenceSection[key];
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
  });
}
