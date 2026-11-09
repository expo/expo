import { IOSConfig, XcodeProject } from '@expo/config-plugins';
import * as path from 'path';

import { addPbxGroup } from '../ios/xcode/addPbxGroup';

const templateProjectRoot = path.resolve(
  __dirname,
  '../../../../../templates/expo-template-bare-minimum'
);

const shareExtensionFiles = {
  swiftFiles: [],
  entitlementFiles: [],
  plistFiles: [],
  assetDirectories: [],
  intentFiles: [],
  otherFiles: [],
  sharedFiles: null,
};

function getFileReferencesInMoreThanOneGroup(xcodeProject: XcodeProject): string[] {
  const children = Object.values(xcodeProject.hash.project.objects.PBXGroup)
    .filter((group) => typeof group === 'object')
    .flatMap((group) => group.children.map(({ value }: { value: string }) => value));
  return children.filter((value, index) => children.indexOf(value) !== index);
}

it(`gives the share extension group its own Info.plist reference`, () => {
  const xcodeProject = IOSConfig.XcodeUtils.getPbxproj(templateProjectRoot);
  // Another extension target, for example from expo-widgets, already has a group-relative Info.plist.
  xcodeProject.addPbxGroup(['Info.plist'], 'OtherExtension', 'OtherExtension');

  addPbxGroup(xcodeProject, 'expo-sharing-extension', shareExtensionFiles, '/app/ios');

  const shareExtensionGroup = xcodeProject.pbxGroupByName('expo-sharing-extension');
  expect(shareExtensionGroup?.children.map(({ comment }) => comment)).toContain('Info.plist');
  expect(getFileReferencesInMoreThanOneGroup(xcodeProject)).toEqual([]);
});
