import { XcodeProject } from 'expo/config-plugins';

interface AddProductFileProps {
  targetName: string;
  groupName: string;
}

export function addProductFile(
  xcodeProject: XcodeProject,
  { targetName, groupName }: AddProductFileProps
) {
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
