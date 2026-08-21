import { IOSConfig } from '@expo/config-plugins';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { updateXcodeProject } from '../xcodeProjectUpdates';

describe('updateXcodeProject', () => {
  let tempProjectRoot: string | null = null;
  const FIXTURE_PATH = path.resolve(__dirname, 'fixtures/bare-project');

  beforeEach(async () => {
    const tempDir = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'xcode-updates-test-'));
    await fs.promises.cp(FIXTURE_PATH, tempDir, { recursive: true });
    tempProjectRoot = tempDir;
  });

  afterEach(async () => {
    if (tempProjectRoot && fs.existsSync(tempProjectRoot)) {
      await fs.promises.rm(tempProjectRoot, { recursive: true, force: true });
    }
    jest.resetAllMocks();
  });

  it('adds watched directories to the PBX project', async () => {
    expect(tempProjectRoot).toBeTruthy();
    expect(tempProjectRoot).toBeDefined();
    tempProjectRoot = tempProjectRoot as string;

    await updateXcodeProject(tempProjectRoot, {
      watchedDirectories: ['app'],
      name: 'bare-project',
    });

    const pbxProject = IOSConfig.XcodeUtils.getPbxproj(tempProjectRoot);
    const objects = pbxProject.hash.project.objects;
    const rootGroups = objects.PBXFileSystemSynchronizedRootGroup;
    expect(rootGroups).toBeDefined();

    const rootGroupKeys = Object.keys(rootGroups).filter((key) => !key.endsWith('_comment'));
    expect(rootGroupKeys).toHaveLength(1);

    const rootGroupUUID = rootGroupKeys[0]!;
    expect(rootGroups[rootGroupUUID]).toEqual(
      expect.objectContaining({
        isa: 'PBXFileSystemSynchronizedRootGroup',
        name: 'app',
      })
    );
  });

  it('resolves the main target from the actual project when it differs from the app name', async () => {
    expect(tempProjectRoot).toBeTruthy();
    expect(tempProjectRoot).toBeDefined();
    tempProjectRoot = tempProjectRoot as string;

    // The fixture's on-disk main target is named "HelloWorld", but the sanitized
    // form of this app name does not match it.
    await updateXcodeProject(tempProjectRoot, {
      watchedDirectories: ['app'],
      name: 'Sömething Élse',
    });

    const pbxProject = IOSConfig.XcodeUtils.getPbxproj(tempProjectRoot);
    const objects = pbxProject.hash.project.objects;
    const nativeTargets = objects.PBXNativeTarget;
    const mainTargetUUID = Object.keys(nativeTargets).find(
      (key) => !key.endsWith('_comment') && nativeTargets[key]?.name === 'HelloWorld'
    );
    expect(mainTargetUUID).toBeTruthy();

    const mainTarget = nativeTargets[mainTargetUUID!] as unknown as {
      fileSystemSynchronizedGroups?: { value: string; comment?: string }[];
    };
    expect(mainTarget.fileSystemSynchronizedGroups).toEqual(
      expect.arrayContaining([expect.objectContaining({ comment: 'app' })])
    );
  });

  it('does nothing if watchedDirectories is empty', async () => {
    expect(tempProjectRoot).toBeTruthy();
    expect(tempProjectRoot).toBeDefined();
    tempProjectRoot = tempProjectRoot as string;

    const pbxProjPath = path.join(
      tempProjectRoot,
      'ios',
      'bare-project.xcodeproj',
      'project.pbxproj'
    );
    const contentBefore = await fs.promises.readFile(pbxProjPath, 'utf8');
    expect(contentBefore).toBeTruthy();

    await updateXcodeProject(tempProjectRoot, { watchedDirectories: [], name: 'bare-project' });

    const contentAfter = await fs.promises.readFile(pbxProjPath, 'utf8');

    // We shouldn't change the pbxproj if there are no watchedDirectories
    expect(contentAfter).toEqual(contentBefore);
  });
});
