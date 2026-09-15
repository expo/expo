import fs from 'node:fs';
import path from 'node:path';

import { createFakeProject, execute, executePassing, projectRoot } from './utils';

const templatePath = path.resolve(__dirname, '../../../expo-module-template');

function createHost(name: string, sdk: number) {
  const app = createFakeProject(name);
  const expoDir = path.join(app, 'node_modules', 'expo');
  fs.mkdirSync(expoDir, { recursive: true });
  fs.writeFileSync(path.join(expoDir, 'package.json'), JSON.stringify({ version: `${sdk}.0.0` }));
  return app;
}

async function expectFailure(args: string[], cwd: string, message: string) {
  const result = execute(args, { cwd });
  await expect(result).rejects.toMatchObject({
    status: 1,
    stderr: expect.stringContaining(message),
  });
  await expect(result).rejects.toMatchObject({
    stderr: expect.not.stringMatching(/^\s+at\s/m),
  });
}

afterAll(async () => {
  await fs.promises.rm(projectRoot, { recursive: true, force: true });
});

describe('host SDK resolution', () => {
  it('prints unsupported SDK guidance in red without a stack trace', async () => {
    const app = createHost('unsupported-create', 54);
    const result = execute(['probe', '--local'], { cwd: app, env: { FORCE_COLOR: '1' } });
    await expect(result).rejects.toMatchObject({
      status: 1,
      stderr: expect.stringContaining(
        '\u001b[31mThis version of create-expo-module does not support local modules in Expo SDK 54.'
      ),
    });
    await expect(result).rejects.toMatchObject({
      stderr: expect.not.stringMatching(/^\s+at\s/m),
    });
    expect(fs.existsSync(path.join(app, 'modules'))).toBe(false);
  });

  it('ignores an unrelated Expo installation exposed through NODE_PATH', async () => {
    const unrelated = createHost('global-sdk-54', 54);
    const app = createFakeProject('no-expo');
    await executePassing(
      ['probe', '--local', '--name', 'Probe', '--platform', 'apple', '--source', templatePath],
      { cwd: app, env: { NODE_PATH: path.join(unrelated, 'node_modules') } }
    );
    const podspec = await fs.promises.readFile(
      path.join(app, 'modules/probe/ios/Probe.podspec'),
      'utf8'
    );
    expect(podspec).toContain(":ios => '16.4'");
  });
});

describe('SDK 54 add-platform support gate', () => {
  it.each([
    ['inside', false],
    ['outside', false],
    ['inside', true],
    ['outside', true],
  ] as const)('rejects from %s the app (custom source: %s)', async (location, source) => {
    const app = createHost(`unsupported-add-${location}-${source}`, 54);
    const target = path.join(app, 'modules/probe');
    await fs.promises.mkdir(target, { recursive: true });
    await fs.promises.writeFile(
      path.join(target, 'expo-module.config.json'),
      JSON.stringify({
        platforms: ['android'],
        android: { modules: ['expo.modules.probe.ProbeModule'] },
      })
    );
    const before = await fs.promises.readFile(path.join(target, 'expo-module.config.json'), 'utf8');

    await expectFailure(
      [
        'add-platform-support',
        target,
        '--platform',
        'apple',
        ...(source ? ['--source', templatePath] : []),
      ],
      location === 'inside' ? app : projectRoot,
      'npx create-expo-module@sdk-55 --local'
    );

    expect(await fs.promises.readdir(target)).toEqual(['expo-module.config.json']);
    expect(await fs.promises.readFile(path.join(target, 'expo-module.config.json'), 'utf8')).toBe(
      before
    );
  });
});
