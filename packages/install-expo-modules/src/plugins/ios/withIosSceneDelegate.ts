import type { ConfigPlugin, InfoPlist } from '@expo/config-plugins';
import { IOSConfig, withDangerousMod, withInfoPlist, withPlugins } from '@expo/config-plugins';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { PBXBuildFile, PBXFileReference, PBXFrameworksBuildPhase, PBXGroup } from 'xcparse';
import { ISA } from 'xcparse';

import type { XCParseXcodeProject } from './withXCParseXcodeProject';
import { withXCParseXcodeProject } from './withXCParseXcodeProject';

type PBXSourcesBuildPhase = Omit<PBXFrameworksBuildPhase, 'isa'> & {
  isa: ISA.PBXSourcesBuildPhase;
};

const SCENE_DELEGATE_FILE_NAME = 'SceneDelegate.swift';

const SCENE_DELEGATE_CONTENTS = `internal import Expo

@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
}
`;

export const withIosSceneDelegate: ConfigPlugin = (config) => {
  return withPlugins(config, [
    withSceneDelegateFile,
    withSceneDelegateXcodeProject,
    withSceneManifest,
  ]);
};

const withSceneDelegateFile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const appDelegatePath = IOSConfig.Paths.getAppDelegateFilePath(config.modRequest.projectRoot);
      await writeSceneDelegateFileAsync(path.dirname(appDelegatePath));
      return config;
    },
  ]);
};

const withSceneDelegateXcodeProject: ConfigPlugin = (config) => {
  return withXCParseXcodeProject(config, (config) => {
    config.modResults = addSceneDelegateToXcodeProject(config.modResults);
    return config;
  });
};

const withSceneManifest: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults = setSceneManifest(config.modResults);
    return config;
  });
};

export async function writeSceneDelegateFileAsync(directory: string): Promise<void> {
  const filePath = path.join(directory, SCENE_DELEGATE_FILE_NAME);
  if (fs.existsSync(filePath)) {
    return;
  }
  await fs.promises.writeFile(filePath, SCENE_DELEGATE_CONTENTS);
}

export function addSceneDelegateToXcodeProject(project: XCParseXcodeProject): XCParseXcodeProject {
  const objects = project.objects ?? {};
  const entries = Object.entries(objects);
  const fileReferences = entries.filter(([, obj]) => obj.isa === ISA.PBXFileReference) as [
    string,
    PBXFileReference,
  ][];

  if (
    fileReferences.some(([, ref]) => path.basename(ref.path ?? '') === SCENE_DELEGATE_FILE_NAME)
  ) {
    return project;
  }

  const appDelegateEntry = fileReferences.find(
    ([, ref]) => path.basename(ref.path ?? '') === 'AppDelegate.swift'
  );
  const appDelegateBuildFileEntry =
    appDelegateEntry &&
    (entries.find(
      ([, obj]) =>
        obj.isa === ISA.PBXBuildFile && (obj as PBXBuildFile).fileRef === appDelegateEntry[0]
    ) as [string, PBXBuildFile] | undefined);
  const group =
    appDelegateEntry &&
    (entries.find(
      ([, obj]) =>
        obj.isa === ISA.PBXGroup && (obj as PBXGroup).children.includes(appDelegateEntry[0])
    )?.[1] as PBXGroup | undefined);
  const sourcesPhase =
    appDelegateBuildFileEntry &&
    (entries.find(
      ([, obj]) =>
        obj.isa === ISA.PBXSourcesBuildPhase &&
        (obj as PBXSourcesBuildPhase).files.includes(appDelegateBuildFileEntry[0])
    )?.[1] as PBXSourcesBuildPhase | undefined);

  if (!appDelegateEntry || !group || !sourcesPhase) {
    throw new Error(
      `Unable to find AppDelegate.swift in the Xcode project, so ${SCENE_DELEGATE_FILE_NAME} could not be added to the app target. Add the file to your app target in Xcode manually.`
    );
  }

  const [appDelegateRefId, appDelegateRef] = appDelegateEntry;
  const sceneDelegateRefId = createObjectId(objects);
  objects[sceneDelegateRefId] = {
    isa: ISA.PBXFileReference,
    lastKnownFileType: 'sourcecode.swift',
    name: SCENE_DELEGATE_FILE_NAME,
    path: path.join(path.dirname(appDelegateRef.path ?? ''), SCENE_DELEGATE_FILE_NAME),
    sourceTree: '<group>',
  } as unknown as PBXFileReference;

  const sceneDelegateBuildFileId = createObjectId(objects);
  objects[sceneDelegateBuildFileId] = {
    isa: ISA.PBXBuildFile,
    fileRef: sceneDelegateRefId,
  } as PBXBuildFile;

  group.children.splice(group.children.indexOf(appDelegateRefId) + 1, 0, sceneDelegateRefId);
  sourcesPhase.files.push(sceneDelegateBuildFileId);

  project.objects = objects;
  return project;
}

export function setSceneManifest(infoPlist: InfoPlist): InfoPlist {
  if (infoPlist.UIApplicationSceneManifest) {
    return infoPlist;
  }
  infoPlist.UIApplicationSceneManifest = {
    UIApplicationSupportsMultipleScenes: false,
    UISceneConfigurations: {
      UIWindowSceneSessionRoleApplication: [
        {
          UISceneConfigurationName: 'Default Configuration',
          UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
        },
      ],
    },
  };
  return infoPlist;
}

function createObjectId(objects: Record<string, unknown>): string {
  let id: string;
  do {
    id = crypto.randomBytes(12).toString('hex').toUpperCase();
  } while (id in objects);
  return id;
}
