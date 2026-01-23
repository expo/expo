import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import { it } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { updateXCodeProject } from '../src/xcodeProjectUpdates';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(),
}));

describe('updateXCodeProject', () => {
  let tempProjectRoot: string | null = null;
  const FIXTURE_PATH = path.resolve(__dirname, 'bare-project');

  beforeEach(async () => {
    const tempDir = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'xcode-updates-test-'));
    await fs.promises.cp(FIXTURE_PATH, path.join(tempDir, 'ios'), { recursive: true });
    tempProjectRoot = tempDir;
  });

  afterEach(async () => {
    if (tempProjectRoot && fs.existsSync(tempProjectRoot)) {
      await fs.promises.rm(tempProjectRoot, { recursive: true, force: true });
    }
    jest.resetAllMocks();
  });

  it('adds watched directories to the PBX project', async () => {
    (getConfig as jest.Mock).mockReturnValue({
      exp: {
        experiments: {
          inlineModules: {
            watchedDirectories: ['app'],
          },
        },
      },
    });

    expect(tempProjectRoot).toBeTruthy();
    expect(tempProjectRoot).toBeDefined();
    tempProjectRoot = tempProjectRoot as string;
    const modulePath = path.resolve(tempProjectRoot as string, 'app');
    await fs.promises.mkdir(modulePath, { recursive: true });

    await updateXCodeProject(tempProjectRoot);

    const pbxProject = IOSConfig.XcodeUtils.getPbxproj(tempProjectRoot);
    const objects = pbxProject.hash.project.objects;
    const rootGroups = objects.PBXFileSystemSynchronizedRootGroup;
    expect(rootGroups).toBeDefined();

    const rootGroupKeys = Object.keys(rootGroups).filter((key) => !key.endsWith('_comment'));
    expect(rootGroupKeys).toHaveLength(1);

    const rootGroupUUID = rootGroupKeys[0];
    expect(rootGroups[rootGroupUUID]).toEqual(
      expect.objectContaining({
        isa: 'PBXFileSystemSynchronizedRootGroup',
        name: 'app',
      })
    );
  });

  it('does nothing if watchedDirectories is empty', async () => {
    (getConfig as jest.Mock).mockReturnValue({
      exp: { experiments: { inlineModules: { watchedDirectories: [] } } },
    });

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

    await updateXCodeProject(tempProjectRoot);

    const contentAfter = await fs.promises.readFile(pbxProjPath, 'utf8');

    // We shouldn't change the pbxproj if there are no watchedDirectories
    expect(contentAfter).toEqual(contentBefore);
  });
});
