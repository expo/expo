import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import path from 'path';

import { resolveExpoConfigPluginsPackagePath } from '../ExpoResolver';
import { resolveProjectWorkflowAsync } from '../ProjectWorkflow';
import { buildPathMatchObjects } from '../utils/Path';

const defaultSpawnAsync = async (command, args) => {
  if (command === 'git' && args[0] === '--help') {
    return { status: 0 };
  }
  if (command === 'git' && args[0] === 'rev-parse' && args[1] === '--show-toplevel') {
    return { stdout: '/app' };
  }
  throw new Error(`Unexpected command: ${command} ${args.join(' ')}`);
};
jest.mock('@expo/spawn-async', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(defaultSpawnAsync),
}));
jest.mock('fs');
jest.mock('fs/promises');

describe(resolveProjectWorkflowAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return managed workflow for a empty project', async () => {
    expect(await resolveProjectWorkflowAsync('/app', 'android', [])).toEqual('managed');
    expect(await resolveProjectWorkflowAsync('/app', 'ios', [])).toEqual('managed');
  });

  it('should return generic workflow for a project with a build.gradle file', async () => {
    vol.fromJSON({
      '/app/android/app/build.gradle': '',
    });
    expect(await resolveProjectWorkflowAsync('/app', 'android', [])).toEqual('generic');
  });

  it('should return generic workflow for a project with a pbxproj file', async () => {
    vol.fromJSON({
      '/app/ios/app.xcodeproj/project.pbxproj': '',
    });
    expect(await resolveProjectWorkflowAsync('/app', 'ios', [])).toEqual('generic');
  });

  it('should return managed workflow for a project with native project files and ignored by .fingerprintignore', async () => {
    const ignorePaths = buildPathMatchObjects(['android/**/*', 'ios/**/*']);
    vol.fromJSON({
      '/app/android/app/build.gradle': '',
      '/app/ios/app.xcodeproj/project.pbxproj': '',
    });
    expect(await resolveProjectWorkflowAsync('/app', 'android', ignorePaths)).toEqual('managed');
    expect(await resolveProjectWorkflowAsync('/app', 'ios', ignorePaths)).toEqual('managed');
  });

  it('should return managed workflow for a project with native project files and ignored by gitignore', async () => {
    const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;
    mockSpawnAsync.mockImplementation(async (command, args, options) => {
      if (command === 'git' && args[0] === 'check-ignore' && args[1] === '-q') {
        if (['android/app/build.gradle', 'ios/app.xcodeproj/project.pbxproj'].includes(args[2])) {
          return { status: 0 };
        } else {
          throw new Error('Not gitignored');
        }
      }
      return defaultSpawnAsync(command, args);
    });

    vol.fromJSON({
      '/app/android/app/build.gradle': '',
      '/app/ios/app.xcodeproj/project.pbxproj': '',
    });
    expect(await resolveProjectWorkflowAsync('/app', 'android', [])).toEqual('managed');
    expect(await resolveProjectWorkflowAsync('/app', 'ios', [])).toEqual('managed');

    mockSpawnAsync.mockReset();
  });
});

describe('config-plugins API', () => {
  afterEach(() => {
    vol.reset();
  });

  it('should keep the Paths API calls stable', async () => {
    vol.fromJSON({
      '/app/android/app/build.gradle': '',
      '/app/ios/app.xcodeproj/project.pbxproj': '',
    });
    const projectRoot = '/app';
    const { AndroidConfig, IOSConfig } = require(resolveExpoConfigPluginsPackagePath(projectRoot));

    expect(AndroidConfig.Paths.getAndroidManifestAsync).toBeDefined();
    const manifestPath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
    expect(manifestPath).toBe('/app/android/app/src/main/AndroidManifest.xml');
    expect(IOSConfig.Paths.getPBXProjectPath).toBeDefined();
    const pbxProjectPath = await IOSConfig.Paths.getPBXProjectPath(projectRoot);
    expect(pbxProjectPath).toBe('/app/ios/app.xcodeproj/project.pbxproj');
  });
});
