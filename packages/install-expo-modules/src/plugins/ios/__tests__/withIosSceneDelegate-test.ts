import fs from 'fs';
import os from 'os';
import path from 'path';
import type { PBXBuildFile, PBXFileReference, PBXFrameworksBuildPhase, PBXGroup } from 'xcparse';
import { ISA, build as xcbuild, parse as xcparse } from 'xcparse';

import {
  addSceneDelegateToXcodeProject,
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
