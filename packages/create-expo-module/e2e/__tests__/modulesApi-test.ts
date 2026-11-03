import fs from 'node:fs';
import path from 'node:path';

import { createFakeApp, execute, executePassing, projectRoot } from './utils';

const templatePath = path.resolve(__dirname, '../../../expo-module-template');

function createModuleArgs(args: string[]) {
  return ['probe', '--local', '--name', 'Probe', '--source', templatePath, ...args];
}

/** Creates the `probe` local module in the app and returns its directory. */
async function createModule(app: string, args: string[] = []) {
  await executePassing(createModuleArgs(args), { cwd: app });
  return path.join(app, 'modules', 'probe');
}

function read(moduleDir: string, ...file: string[]) {
  return fs.readFileSync(path.join(moduleDir, ...file), 'utf8');
}

afterAll(async () => {
  await fs.promises.rm(projectRoot, { recursive: true, force: true });
});

describe('--modules-api', () => {
  it('creates an Expo Modules API 2.0 module by default', async () => {
    const moduleDir = await createModule(createFakeApp('modules-api-default', 58), [
      '--features',
      'Function',
      'View',
    ]);

    expect(read(moduleDir, 'ios', 'ProbeModule.swift')).toContain('@ExpoModule("Probe")');
    expect(read(moduleDir, 'ios', 'ProbeViewsModule.swift')).toContain('Name("ProbeViews")');
    expect(read(moduleDir, 'android', 'build.gradle')).toContain('v2 true');
  });

  it('creates an Expo Modules API 1.0 module with v1', async () => {
    const moduleDir = await createModule(createFakeApp('modules-api-v1', 58), [
      '--modules-api',
      'v1',
    ]);

    expect(read(moduleDir, 'ios', 'ProbeModule.swift')).toContain('ModuleDefinition');
    expect(read(moduleDir, 'android', 'build.gradle')).not.toContain('v2 true');
  });

  it('fails without creating the module when v2 is requested in an SDK older than 58', async () => {
    const app = createFakeApp('modules-api-v2-sdk-57', 57);
    await expect(
      execute(createModuleArgs(['--modules-api', 'v2']), { cwd: app })
    ).rejects.toMatchObject({
      status: 1,
      stderr: expect.stringContaining('--modules-api v1'),
    });
    expect(fs.existsSync(path.join(app, 'modules', 'probe'))).toBe(false);
  });
});
