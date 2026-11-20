import { IOSConfig, type XcodeProject } from 'expo/config-plugins';
import * as path from 'path';

import { addPbxGroup } from '../ios/xcode/addPbxGroup';

const templateProjectRoot = path.resolve(
  __dirname,
  '../../../../../templates/expo-template-bare-minimum'
);

function getFileReferencesInMoreThanOneGroup(xcodeProject: XcodeProject): string[] {
  const children = Object.values(xcodeProject.hash.project.objects.PBXGroup)
    .filter((group) => typeof group === 'object')
    .flatMap((group) => group.children.map(({ value }: { value: string }) => value));
  return children.filter((value, index) => children.indexOf(value) !== index);
}

it(`gives the widget extension group its own Info.plist reference`, () => {
  const xcodeProject = IOSConfig.XcodeUtils.getPbxproj(templateProjectRoot);
  // Another extension target, for example from expo-sharing, already has a group-relative Info.plist.
  xcodeProject.addPbxGroup(['Info.plist'], 'OtherExtension', 'OtherExtension');

  addPbxGroup(xcodeProject, { targetName: 'ExpoWidgetsTarget', widgetFiles: ['Info.plist'] });

  const widgetGroup = xcodeProject.pbxGroupByName('ExpoWidgetsTarget');
  expect(widgetGroup?.children.map(({ comment }) => comment)).toContain('Info.plist');
  expect(getFileReferencesInMoreThanOneGroup(xcodeProject)).toEqual([]);
});
