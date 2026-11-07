import { IOSConfig } from 'expo/config-plugins';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { addPbxGroup } from '../ios/xcode/addPbxGroup';

const template = path.join(
  __dirname,
  '../../../../../templates/expo-template-bare-minimum/ios/HelloWorld.xcodeproj/project.pbxproj'
);

describe(addPbxGroup, () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-widgets-'));
    fs.mkdirSync(path.join(projectRoot, 'ios/HelloWorld.xcodeproj'), { recursive: true });
    fs.copyFileSync(template, path.join(projectRoot, 'ios/HelloWorld.xcodeproj/project.pbxproj'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('does not reuse the Info.plist file reference of another extension group', () => {
    const project = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
    project.addPbxGroup(['Info.plist'], 'OtherExtension', 'OtherExtension');

    addPbxGroup(project, {
      targetName: 'ExpoWidgetsTarget',
      widgetFiles: ['Info.plist', 'index.swift'],
    });

    const getInfoPlistReference = (groupName: string) =>
      project.pbxGroupByName(groupName)?.children.find(({ comment }) => comment === 'Info.plist')
        ?.value;
    const widgetsInfoPlist = getInfoPlistReference('ExpoWidgetsTarget');

    expect(widgetsInfoPlist).toBeDefined();
    expect(widgetsInfoPlist).not.toBe(getInfoPlistReference('OtherExtension'));
    expect(project.hash.project.objects.PBXFileReference[widgetsInfoPlist!]).toMatchObject({
      isa: 'PBXFileReference',
    });
  });
});
