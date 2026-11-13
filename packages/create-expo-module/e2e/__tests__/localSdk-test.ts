import fs from 'node:fs';
import path from 'node:path';

import { createFakeProject, execute, executePassing, projectRoot } from './utils';

const templatePath = path.resolve(__dirname, '../../../expo-module-template');

function createSdk55App(name: string) {
  const app = createFakeProject(name);
  const expoDir = path.join(app, 'node_modules', 'expo');
  fs.mkdirSync(expoDir, { recursive: true });
  fs.writeFileSync(path.join(expoDir, 'package.json'), JSON.stringify({ version: '55.0.0' }));
  return app;
}

async function expectRejected(args: string[], cwd: string) {
  const result = execute(args, { cwd });
  await expect(result).rejects.toMatchObject({
    status: 1,
    stderr: expect.stringContaining('re-run the command with --ignore-compatibility-check'),
  });
  // Expected failures print only the message, without a stack trace.
  await expect(result).rejects.toMatchObject({
    stderr: expect.not.stringMatching(/^\s+at\s/m),
  });
}

afterAll(async () => {
  await fs.promises.rm(projectRoot, { recursive: true, force: true });
});

describe('local modules in an unsupported Expo SDK', () => {
  it('creates a module only with --ignore-compatibility-check', async () => {
    const app = createSdk55App('create-sdk-55');
    const args = ['probe', '--local', '--name', 'Probe', '--platform', 'apple'];
    const moduleDir = path.join(app, 'modules', 'probe');

    await expectRejected([...args, '--source', templatePath], app);
    expect(fs.existsSync(moduleDir)).toBe(false);

    const { stderr } = await executePassing(
      [...args, '--source', templatePath, '--ignore-compatibility-check'],
      { cwd: app }
    );
    expect(stderr).toContain('Skipping the Expo SDK compatibility check');
    expect(fs.existsSync(path.join(moduleDir, 'ios', 'ProbeModule.swift'))).toBe(true);
  });

  it('adds a platform only with --ignore-compatibility-check, using the SDK of the working directory', async () => {
    // A module outside the app (e.g. in a custom `nativeModulesDir`) has no `expo` above it.
    const detached = createFakeProject('detached-modules');
    await executePassing(
      ['probe', '--local', '--name', 'Probe', '--platform', 'apple', '--source', templatePath],
      { cwd: detached }
    );
    const moduleDir = path.join(detached, 'modules', 'probe');
    const app = createSdk55App('add-platform-sdk-55');
    const args = ['add-platform-support', moduleDir, '--platform', 'android'];

    await expectRejected([...args, '--source', templatePath], app);
    expect(fs.existsSync(path.join(moduleDir, 'android'))).toBe(false);

    await executePassing([...args, '--source', templatePath, '--ignore-compatibility-check'], {
      cwd: app,
    });
    expect(fs.existsSync(path.join(moduleDir, 'android', 'build.gradle'))).toBe(true);
  });
});
