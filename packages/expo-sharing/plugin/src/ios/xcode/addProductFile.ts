import { XcodeProject } from '@expo/config-plugins';

export function addProductFile(xcodeProject: XcodeProject, targetName: string, groupName: string) {
  const options = {
    basename: `${targetName}.appex`,
    group: groupName,
    explicitFileType: 'wrapper.app-extension',
    settings: {
      ATTRIBUTES: ['RemoveHeadersOnCopy'],
    },
    includeInIndex: 0,
    path: `${targetName}.appex`,
    sourceTree: 'BUILT_PRODUCTS_DIR',
  };

  return xcodeProject.addProductFile(targetName, options);
}
