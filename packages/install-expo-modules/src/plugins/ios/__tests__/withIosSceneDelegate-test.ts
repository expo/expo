import fs from 'fs';
import os from 'os';
import path from 'path';
import type { PBXBuildFile, PBXFileReference, PBXFrameworksBuildPhase, PBXGroup } from 'xcparse';
import { ISA, build as xcbuild, parse as xcparse } from 'xcparse';

import { updateVirtualMetroEntryIos } from '../../cli/withCliIntegration';
import { updateModulesAppDelegateSwift } from '../withIosModulesAppDelegate';
import {
  addSceneDelegateToXcodeProject,
  migrateSceneDelegateLayout,
  migrateSceneDelegateLayoutAsync,
  setSceneManifest,
  writeSceneDelegateFileAsync,
} from '../withIosSceneDelegate';
import type { XCParseXcodeProject } from '../withXCParseXcodeProject';

const fixturesPath = path.resolve(__dirname, 'fixtures');

function findObjects<T>(
  project: XCParseXcodeProject,
  isa: ISA,
  predicate: (obj: T) => boolean
): [string, T][] {
  return Object.entries(project.objects ?? {}).filter(
    ([, obj]) => obj.isa === isa && predicate(obj as T)
  ) as [string, T][];
}

function findObject<T>(project: XCParseXcodeProject, isa: ISA, predicate: (obj: T) => boolean) {
  const matches = findObjects(project, isa, predicate);
  expect(matches).toHaveLength(1);
  return matches[0] as [string, T];
}

describe(addSceneDelegateToXcodeProject, () => {
  async function loadProject() {
    const contents = await fs.promises.readFile(
      path.join(fixturesPath, 'xcodeProject-rn088.pbxproj'),
      'utf8'
    );
    return xcparse(contents);
  }

  it('should add SceneDelegate.swift next to AppDelegate.swift and compile it', async () => {
    const project = addSceneDelegateToXcodeProject(await loadProject());

    const [sceneRefId, sceneRef] = findObject<PBXFileReference>(
      project,
      ISA.PBXFileReference,
      (ref) => ref.path === 'HelloWorld/SceneDelegate.swift'
    );
    expect(sceneRef).toMatchObject({
      lastKnownFileType: 'sourcecode.swift',
      name: 'SceneDelegate.swift',
      sourceTree: '<group>',
    });

    const [appDelegateRefId] = findObject<PBXFileReference>(
      project,
      ISA.PBXFileReference,
      (ref) => ref.path === 'HelloWorld/AppDelegate.swift'
    );
    const [, group] = findObject<PBXGroup>(project, ISA.PBXGroup, (group) =>
      group.children.includes(appDelegateRefId)
    );
    expect(group.children).toContain(sceneRefId);

    const [sceneBuildFileId] = findObject<PBXBuildFile>(
      project,
      ISA.PBXBuildFile,
      (file) => file.fileRef === sceneRefId
    );
    findObject<PBXFrameworksBuildPhase>(project, ISA.PBXSourcesBuildPhase, (phase) =>
      phase.files.includes(sceneBuildFileId)
    );
  });

  it('should be idempotent', async () => {
    const once = addSceneDelegateToXcodeProject(await loadProject());
    const objectCount = Object.keys(once.objects ?? {}).length;
    const twice = addSceneDelegateToXcodeProject(once);
    expect(Object.keys(twice.objects ?? {})).toHaveLength(objectCount);
  });

  it('should serialize to a project file that parses back with the new entries', async () => {
    const project = addSceneDelegateToXcodeProject(await loadProject());
    const reparsed = xcparse(xcbuild(project));
    const refs = findObjects<PBXFileReference>(
      reparsed,
      ISA.PBXFileReference,
      (ref) => ref.path === 'HelloWorld/SceneDelegate.swift'
    );
    expect(refs).toHaveLength(1);
  });
});

describe(setSceneManifest, () => {
  it('should add a single-scene manifest pointing at SceneDelegate', () => {
    const infoPlist = setSceneManifest({ CFBundleDisplayName: 'HelloWorld' });
    expect(infoPlist.UIApplicationSceneManifest).toEqual({
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    });
    expect(infoPlist.CFBundleDisplayName).toBe('HelloWorld');
  });

  it('should keep an existing manifest untouched', () => {
    const existing = { UIApplicationSupportsMultipleScenes: true };
    const infoPlist = setSceneManifest({ UIApplicationSceneManifest: existing });
    expect(infoPlist.UIApplicationSceneManifest).toBe(existing);
  });
});

describe(writeSceneDelegateFileAsync, () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'install-expo-modules-'));
  });
  afterEach(async () => {
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it('should write a SceneDelegate subclassing ExpoAppSceneDelegate', async () => {
    await writeSceneDelegateFileAsync(dir);
    const contents = await fs.promises.readFile(path.join(dir, 'SceneDelegate.swift'), 'utf8');
    expect(contents).toBe(`internal import Expo

@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
}
`);
  });

  it('should not overwrite an existing SceneDelegate.swift', async () => {
    const filePath = path.join(dir, 'SceneDelegate.swift');
    await fs.promises.writeFile(filePath, 'custom');
    await writeSceneDelegateFileAsync(dir);
    expect(await fs.promises.readFile(filePath, 'utf8')).toBe('custom');
  });
});

describe(migrateSceneDelegateLayout, () => {
  const read = (name: string) => fs.readFileSync(path.join(fixturesPath, name), 'utf8');
  const fixtures = {
    appDelegate: read('AppDelegate-rn088-scene.swift'),
    sceneDelegate: read('SceneDelegate-rn088.swift'),
  };
  const expected = {
    appDelegate: read('AppDelegate-rn088-scene-updated.swift'),
    sceneDelegate: read('SceneDelegate-rn088-updated.swift'),
  };

  it('moves React Native startup from the RN 0.88 SceneDelegate into AppDelegate', () => {
    expect(migrateSceneDelegateLayout(fixtures)).toEqual(expected);
  });

  it('is idempotent with the later AppDelegate and CLI mods', () => {
    const migrated = migrateSceneDelegateLayout(fixtures)!;
    expect(migrateSceneDelegateLayout(migrated)).toBeNull();
    expect(updateModulesAppDelegateSwift(migrated.appDelegate, '58.0.0')).toBe(
      expected.appDelegate
    );
    expect(updateVirtualMetroEntryIos(migrated.appDelegate)).toContain(
      'forBundleRoot: ".expo/.virtual-metro-entry"'
    );
  });

  it('accepts a different module name and whitespace', () => {
    const sceneDelegate = fixtures.sceneDelegate
      .replace('withModuleName: "HelloWorld"', 'withModuleName:"Probe"')
      .replace(/\n\s*\n/g, '\n')
      .replace(/^ {2}/gm, '\t');
    const migrated = migrateSceneDelegateLayout({ ...fixtures, sceneDelegate });
    expect(migrated?.sceneDelegate).toBe(expected.sceneDelegate);
    expect(migrated?.appDelegate).toContain('let reactNativeFactoryModuleName = "Probe"');
  });

  it('refuses a SceneDelegate with custom scene code', () => {
    const sceneDelegate = fixtures.sceneDelegate.replace(
      'window = UIWindow(windowScene: windowScene)',
      'window = UIWindow(windowScene: windowScene)\n    window?.tintColor = .red'
    );
    expect(() => migrateSceneDelegateLayout({ ...fixtures, sceneDelegate })).toThrow(
      /SceneDelegate\.swift differs from the React Native 0\.88 template.*discard.*run install-expo-modules again/
    );
  });

  it('leaves other layouts untouched', () => {
    expect(
      migrateSceneDelegateLayout({
        appDelegate: read('AppDelegate-rn088.swift'),
        sceneDelegate: expected.sceneDelegate,
      })
    ).toBeNull();
  });
});

describe(migrateSceneDelegateLayoutAsync, () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'install-expo-modules-'));
  });
  afterEach(async () => {
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it('rewrites both delegate files', async () => {
    const appDelegatePath = path.join(dir, 'AppDelegate.swift');
    await fs.promises.copyFile(
      path.join(fixturesPath, 'AppDelegate-rn088-scene.swift'),
      appDelegatePath
    );
    await fs.promises.copyFile(
      path.join(fixturesPath, 'SceneDelegate-rn088.swift'),
      path.join(dir, 'SceneDelegate.swift')
    );
    await migrateSceneDelegateLayoutAsync(appDelegatePath);
    expect(await fs.promises.readFile(appDelegatePath, 'utf8')).toBe(
      await fs.promises.readFile(
        path.join(fixturesPath, 'AppDelegate-rn088-scene-updated.swift'),
        'utf8'
      )
    );
    expect(await fs.promises.readFile(path.join(dir, 'SceneDelegate.swift'), 'utf8')).toBe(
      await fs.promises.readFile(
        path.join(fixturesPath, 'SceneDelegate-rn088-updated.swift'),
        'utf8'
      )
    );
  });

  it('does nothing without SceneDelegate.swift', async () => {
    const appDelegatePath = path.join(dir, 'AppDelegate.swift');
    await fs.promises.writeFile(appDelegatePath, 'custom');
    await migrateSceneDelegateLayoutAsync(appDelegatePath);
    expect(await fs.promises.readFile(appDelegatePath, 'utf8')).toBe('custom');
  });
});
