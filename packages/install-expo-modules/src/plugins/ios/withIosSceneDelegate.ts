import type { ConfigPlugin, InfoPlist } from '@expo/config-plugins';
import { IOSConfig, withDangerousMod, withInfoPlist, withPlugins } from '@expo/config-plugins';
import { findSwiftFunctionCodeBlock } from '@expo/config-plugins/build/ios/codeMod';
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

/** `template/ios/HelloWorld/SceneDelegate.swift` from react-native-community/template 0.88-stable. */
const REACT_NATIVE_SCENE_DELEGATE_TEMPLATE = `import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UIKit

class SceneDelegate: RCTDefaultReactNativeFactoryDelegate, UIWindowSceneDelegate {
  var window: UIWindow?
  var reactNativeFactory: RCTReactNativeFactory?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    dependencyProvider = RCTAppDependencyProvider()
    reactNativeFactory = RCTReactNativeFactory(delegate: self)
    window = UIWindow(windowScene: windowScene)

    #if DEBUG
    let devMenuConfiguration = RCTDevMenuConfiguration(
      devMenuEnabled: true,
      shakeGestureEnabled: true,
      keyboardShortcutsEnabled: true
    )
    reactNativeFactory?.devMenuConfiguration = devMenuConfiguration
    #endif

    reactNativeFactory?.startReactNative(
      withModuleName: "HelloWorld",
      in: window,
      connectionOptions: connectionOptions
    )
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    RCTLinkingManager.scene(scene, openURLContexts: URLContexts)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.scene(scene, continue: userActivity)
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
`;

const APP_DELEGATE_IMPORTS = [
  'internal import Expo',
  'import React',
  'import React_RCTAppDelegate',
  'import ReactAppDependencyProvider',
];

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
      if (appDelegatePath.endsWith('.swift')) {
        await migrateSceneDelegateLayoutAsync(appDelegatePath);
      }
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

export async function migrateSceneDelegateLayoutAsync(appDelegatePath: string): Promise<void> {
  const sceneDelegatePath = path.join(path.dirname(appDelegatePath), SCENE_DELEGATE_FILE_NAME);
  if (!fs.existsSync(sceneDelegatePath)) {
    return;
  }
  const migrated = migrateSceneDelegateLayout({
    appDelegate: await fs.promises.readFile(appDelegatePath, 'utf8'),
    sceneDelegate: await fs.promises.readFile(sceneDelegatePath, 'utf8'),
  });
  if (!migrated) {
    return;
  }
  await fs.promises.writeFile(appDelegatePath, migrated.appDelegate);
  await fs.promises.writeFile(sceneDelegatePath, migrated.sceneDelegate);
}

type DelegateSources = { appDelegate: string; sceneDelegate: string };

/**
 * Converts the React Native 0.88 template layout, where `SceneDelegate.swift` creates the factory and
 * starts React Native, into the SDK 58 layout, where `AppDelegate.swift` creates the factory and
 * `ExpoAppSceneDelegate` starts React Native. Returns null for any other layout.
 * Throws when either file has custom code that the rewrite would discard.
 */
export function migrateSceneDelegateLayout({
  appDelegate,
  sceneDelegate,
}: DelegateSources): DelegateSources | null {
  const moduleName = sceneDelegate.match(
    /^class\s+SceneDelegate\s*:\s*RCTDefaultReactNativeFactoryDelegate\b[\s\S]*?startReactNative\(\s*withModuleName:\s*"([^"]+)"/m
  )?.[1];
  if (!moduleName || appDelegate.includes('ReactNativeFactory')) {
    return null;
  }

  if (normalizeSwift(sceneDelegate) !== normalizeSwift(REACT_NATIVE_SCENE_DELEGATE_TEMPLATE)) {
    throw new Error(
      `Cannot install Expo modules because ${SCENE_DELEGATE_FILE_NAME} differs from the React Native 0.88 template. install-expo-modules replaces this file with an ExpoAppSceneDelegate subclass, which would discard your custom scene code. Restore the template ${SCENE_DELEGATE_FILE_NAME}, run install-expo-modules again, then add your custom code to the generated class. See https://docs.expo.dev/bare/installing-expo-modules/`
    );
  }

  const bundleUrlBlock = findSwiftFunctionCodeBlock(sceneDelegate, 'bundleURL()');
  if (!bundleUrlBlock) {
    throw new Error(
      `Cannot install Expo modules because ${SCENE_DELEGATE_FILE_NAME} has no bundleURL() method to move into AppDelegate.swift. Restore the template ${SCENE_DELEGATE_FILE_NAME} and run install-expo-modules again.`
    );
  }
  const bundleUrlBody = bundleUrlBlock.code
    .slice(1, -1)
    .replace(/^\n/, '')
    .replace(/\n[ \t]*$/, '');

  const missingImports = APP_DELEGATE_IMPORTS.filter(
    (line) => !new RegExp(`^${line}$`, 'm').test(appDelegate)
  );
  appDelegate = appDelegate.match(/^import UIKit$/m)
    ? appDelegate.replace(/^import UIKit$/m, (line) => [line, ...missingImports].join('\n'))
    : [...missingImports, appDelegate].join('\n');

  appDelegate = appDelegate.replace(
    /^(class\s+AppDelegate\s*:\s*)UIResponder,\s*UIApplicationDelegate(\s*\{\n)/m,
    `$1ExpoAppDelegate, ExpoReactNativeFactoryProvider$2  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  let reactNativeFactoryModuleName = "${moduleName}"

`
  );

  const launchRegExp =
    /^([ \t]*)func (application\([^{]*didFinishLaunchingWithOptions[^{]*\{\n[\s\S]*?)^[ \t]*(?:return )?true$\n/m;
  if (!appDelegate.includes('ExpoReactNativeFactoryProvider') || !launchRegExp.test(appDelegate)) {
    throw new Error(
      `Cannot install Expo modules because AppDelegate.swift differs from the React Native 0.88 template, so the React Native factory cannot be moved into it from ${SCENE_DELEGATE_FILE_NAME}. Restore the template AppDelegate.swift, run install-expo-modules again, then add your custom code back. See https://docs.expo.dev/bare/installing-expo-modules/`
    );
  }
  appDelegate = appDelegate.replace(
    launchRegExp,
    `$1override func $2    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
`
  );

  appDelegate = `${appDelegate.replace(/\s*$/, '')}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func bundleURL() -> URL? {
${bundleUrlBody}
  }
}
`;

  return { appDelegate, sceneDelegate: SCENE_DELEGATE_CONTENTS };
}

function normalizeSwift(contents: string): string {
  return contents
    .replace(/withModuleName:\s*"[^"]*"/, 'withModuleName: ""')
    .replace(/\s+/g, ' ')
    .trim();
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
