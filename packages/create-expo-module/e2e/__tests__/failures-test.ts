import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import path from 'node:path';

import { createFakeProject, createTestPath, execute, executePassing, projectRoot } from './utils';

const templatePath = path.resolve(__dirname, '../../../expo-module-template');

function createHost(name: string, sdk: number) {
  const app = createFakeProject(name);
  const expoDir = path.join(app, 'node_modules', 'expo');
  fs.mkdirSync(expoDir, { recursive: true });
  fs.writeFileSync(path.join(expoDir, 'package.json'), JSON.stringify({ version: `${sdk}.0.0` }));
  return app;
}

async function snapshot(dir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      files[`${entry.name}/`] = '';
      const children = await snapshot(path.join(dir, entry.name));
      for (const [child, content] of Object.entries(children))
        files[`${entry.name}/${child}`] = content;
    } else {
      files[entry.name] = (await fs.promises.readFile(path.join(dir, entry.name))).toString(
        'base64'
      );
    }
  }
  return files;
}

async function expectFailure(args: string[], cwd: string, message: string) {
  const result = execute(args, { cwd });
  await expect(result).rejects.toMatchObject({
    status: 1,
    stderr: expect.stringContaining(message),
  });
  await expect(result).rejects.toMatchObject({
    stderr: expect.stringMatching(/^\s+at\s/m),
  });
}

let brokenTemplate: string;
beforeAll(async () => {
  brokenTemplate = createTestPath('broken-template');
  await fs.promises.cp(templatePath, brokenTemplate, {
    recursive: true,
    filter: (source) => !['node_modules', 'build'].includes(path.basename(source)),
  });
  // Fail in a file snippet after the template and native files have already been written.
  await fs.promises.writeFile(
    path.join(brokenTemplate, 'snippets/View/view.web.tsx.ejs'),
    '<% throw new Error("INJECTED_RENDER_FAILURE") %>'
  );
});

afterAll(async () => {
  await fs.promises.rm(projectRoot, { recursive: true, force: true });
});

describe('generation rollback', () => {
  it.each([
    ['local', false],
    ['local', true],
    ['standalone', false],
    ['standalone', true],
  ] as const)(
    'restores %s output after a snippet fails (existing target: %s)',
    async (kind, existing) => {
      const app = createHost(`rollback-${kind}-${existing}`, 55);
      const target = path.join(app, ...(kind === 'local' ? ['modules', 'probe'] : ['probe']));
      let before: Record<string, string> = {};
      if (existing) {
        await fs.promises.mkdir(path.join(target, 'src'), { recursive: true });
        await fs.promises.writeFile(path.join(target, 'sentinel.txt'), 'preserve me');
        await fs.promises.writeFile(path.join(target, 'src/Probe.types.ts'), 'original contents');
        before = await snapshot(target);
      }

      await expectFailure(
        [
          'probe',
          ...(kind === 'local' ? ['--local'] : ['--no-example']),
          '--name',
          'Probe',
          '--author-name',
          'Test',
          '--author-email',
          'test@example.com',
          '--author-url',
          'https://example.com',
          '--repo',
          'https://example.com/module',
          '--platform',
          'apple',
          'android',
          'web',
          '--features',
          'View',
          '--source',
          brokenTemplate,
        ],
        app,
        'INJECTED_RENDER_FAILURE'
      );

      if (existing) expect(await snapshot(target)).toEqual(before);
      else expect(fs.existsSync(target)).toBe(false);
    }
  );

  it('rolls back native and web changes together when adding platforms fails', async () => {
    const app = createHost('rollback-add-platform', 55);
    await executePassing(
      [
        'probe',
        '--local',
        '--name',
        'Probe',
        '--platform',
        'apple',
        '--features',
        'View',
        '--source',
        templatePath,
      ],
      { cwd: app }
    );
    const target = path.join(app, 'modules/probe');
    await fs.promises.writeFile(path.join(target, 'src/ProbeView.web.tsx'), 'custom web view');
    const before = await snapshot(target);

    await expectFailure(
      [
        'add-platform-support',
        target,
        '--platform',
        'android',
        'web',
        '--features',
        'View',
        '--source',
        brokenTemplate,
      ],
      projectRoot,
      'INJECTED_RENDER_FAILURE'
    );

    expect(await snapshot(target)).toEqual(before);
  });
});

describe('downloaded template cleanup', () => {
  let npmBin: string;
  let archive: string;

  beforeAll(async () => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const packed = await spawnAsync(npm, [
      'pack',
      brokenTemplate,
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      projectRoot,
      '--cache',
      createTestPath('npm-cache'),
    ]);
    const result = JSON.parse(packed.stdout);
    archive = path.join(
      projectRoot,
      (Array.isArray(result) ? result : Object.values(result))[0].filename
    );
    npmBin = createTestPath('npm-bin');
    const script = path.join(npmBin, 'pack.js');
    await fs.promises.writeFile(
      script,
      `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
if (process.argv[2] !== 'pack') throw new Error('Unexpected npm command');
fs.copyFileSync(process.env.TEMPLATE_TARBALL, path.join(process.cwd(), 'template.tgz'));
process.stdout.write(JSON.stringify([{ filename: 'template.tgz' }]));
`
    );
    if (process.platform === 'win32') {
      await fs.promises.writeFile(
        path.join(npmBin, 'npm.cmd'),
        `@"${process.execPath}" "${script}" %*\r\n`
      );
    } else {
      await fs.promises.copyFile(script, path.join(npmBin, 'npm'));
      await fs.promises.chmod(path.join(npmBin, 'npm'), 0o755);
    }
  });

  it.each(['create', 'add-platform'])(
    'removes extracted templates and rolls back failed %s',
    async (command) => {
      const app = createHost(`download-failure-${command}`, 55);
      const target = path.join(app, 'modules/probe');
      let before: Record<string, string> = {};
      if (command === 'add-platform') {
        await executePassing(
          [
            'probe',
            '--local',
            '--name',
            'Probe',
            '--platform',
            'apple',
            '--features',
            'View',
            '--source',
            templatePath,
          ],
          { cwd: app }
        );
        before = await snapshot(target);
      }
      const tmp = createTestPath(`download-tmp-${command}`);
      const args =
        command === 'create'
          ? ['probe', '--local', '--name', 'Probe']
          : ['add-platform-support', target];
      await expect(
        execute([...args, '--platform', 'android', 'web', '--features', 'View'], {
          cwd: app,
          env: {
            PATH: `${npmBin}${path.delimiter}${process.env.PATH}`,
            TEMPLATE_TARBALL: archive,
            TMPDIR: tmp,
            TMP: tmp,
            TEMP: tmp,
          },
        })
      ).rejects.toMatchObject({
        status: 1,
        stderr: expect.stringContaining('INJECTED_RENDER_FAILURE'),
      });

      if (command === 'create') expect(fs.existsSync(target)).toBe(false);
      else expect(await snapshot(target)).toEqual(before);
      expect(
        (await fs.promises.readdir(tmp)).filter((name) =>
          /^(\.create-expo-module-|create-expo-module-template-|add-platform-support-)/.test(name)
        )
      ).toEqual([]);
    }
  );
});
