import type { XcodeProject } from 'expo/config-plugins';

import { addBuildPhases } from '../ios/xcode/addBuildPhases';
import { getLocalizableStringsFileRefs } from '../ios/xcode/withTargetXcodeProject';

describe(getLocalizableStringsFileRefs, () => {
  it("finds the app's existing Localizable.strings file references", () => {
    const groups = {
      ROOT: { children: [{ value: 'APP', comment: 'HelloWorld' }] },
      APP: { children: [{ value: 'SUPPORTING', comment: 'Supporting' }] },
      SUPPORTING: {
        children: [
          { value: 'DE', comment: 'de.lproj' },
          { value: 'FR', comment: 'fr.lproj' },
        ],
      },
      DE: {
        children: [{ value: 'DE_LOCALIZABLE', comment: 'Localizable.strings' }],
      },
      FR: {
        children: [{ value: 'FR_INFO_PLIST', comment: 'InfoPlist.strings' }],
      },
    };
    const xcodeProject = {
      getFirstProject: () => ({ firstProject: { mainGroup: 'ROOT' } }),
      getPBXGroupByKey: (key: keyof typeof groups) => groups[key],
    } as unknown as XcodeProject;

    expect(getLocalizableStringsFileRefs(xcodeProject, 'HelloWorld', ['de', 'fr', 'es'])).toEqual([
      'DE_LOCALIZABLE',
    ]);
  });
});

describe(addBuildPhases, () => {
  it("adds the app's Localizable.strings file references to the widget resources phase", () => {
    const objects: Record<string, Record<string, any>> = {
      PBXNativeTarget: {
        MAIN_TARGET: { buildPhases: [] },
        WIDGET_TARGET: { buildPhases: [] },
      },
      PBXSourcesBuildPhase: {},
      PBXCopyFilesBuildPhase: {},
      PBXFrameworksBuildPhase: {},
      PBXResourcesBuildPhase: {},
      PBXBuildFile: {},
    };
    let uuid = 0;
    const xcodeProject = {
      hash: { project: { objects } },
      getFirstTarget: () => ({ uuid: 'MAIN_TARGET' }),
      pbxNativeTargetSection: () => objects.PBXNativeTarget,
      pbxBuildFileSection: () => objects.PBXBuildFile,
      generateUuid: () => `UUID_${++uuid}`,
      addBuildPhase: (_files: string[], type: string, name: string, targetUuid: string) => {
        const phaseUuid = `UUID_${++uuid}`;
        objects[type]![phaseUuid] = { files: [] };
        objects.PBXNativeTarget![targetUuid]!.buildPhases.push({
          value: phaseUuid,
          comment: name,
        });
      },
      addToPbxBuildFileSection: (file: { uuid: string; fileRef: string }) => {
        objects.PBXBuildFile![file.uuid] = { fileRef: file.fileRef };
      },
    } as unknown as XcodeProject;
    const props = {
      targetUuid: 'WIDGET_TARGET',
      groupName: 'Embed Foundation Extensions',
      productFile: {
        uuid: 'PRODUCT_BUILD_FILE',
        fileRef: 'PRODUCT_FILE_REF',
        basename: 'ExpoWidgetsTarget.appex',
        group: 'Embed Foundation Extensions',
        target: 'WIDGET_TARGET',
      } as any,
      widgetFiles: ['index.swift'],
      resourceFileRefs: ['DE_LOCALIZABLE', 'EN_LOCALIZABLE', 'DE_LOCALIZABLE'],
    };

    addBuildPhases(xcodeProject, props);
    addBuildPhases(xcodeProject, props);

    const resourcesPhase = Object.values(objects.PBXResourcesBuildPhase!)[0]!;
    const copiedFileRefs = resourcesPhase.files.map(
      ({ value }: { value: string }) => objects.PBXBuildFile![value]!.fileRef
    );
    expect(copiedFileRefs).toEqual(['DE_LOCALIZABLE', 'EN_LOCALIZABLE']);
  });
});
