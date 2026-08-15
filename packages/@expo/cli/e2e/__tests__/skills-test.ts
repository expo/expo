/* eslint-env jest */
import fs from 'fs';
import path from 'path';

import { createExpoStart, executeExpoAsync } from '../utils/expo';
import {
  bin,
  projectRoot,
  getLoadedModulesAsync,
  setupTestProjectWithOptionsAsync,
  writeSkillPackageAsync,
} from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  await fs.promises.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

/** Add a fake dependency that ships skills, directly inside node_modules. */
async function addSkillDependencyAsync(
  projectRoot: string,
  packageName: string,
  skillNames: string[]
) {
  await writeSkillPackageAsync(
    path.join(projectRoot, 'node_modules', packageName),
    packageName,
    skillNames
  );
  const pkgPath = path.join(projectRoot, 'package.json');
  const pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf8'));
  pkg.dependencies[packageName] = '1.0.0';
  await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/skills').expoSkills`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/skills/index.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx expo skills --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['skills', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Link agent skills from installed npm packages

      Usage
        $ npx expo skills [action]

      Options
        [action]                 Action to perform: sync, list, show, clean (default: sync)
        $ npx expo skills show <package> [skill]  Print SKILL.md contents of a package
        --agent <agent>          Link skills for specific agents (can be used multiple times)
        --dry-run                Print planned changes without modifying the project
        --json                   Output the skill list as JSON (with \`list\`)
        -h, --help               Usage info
    "
  `);
});

describe('skills actions', () => {
  let projectRoot: string;

  const linkPath = (linkName: string) => path.join(projectRoot, '.claude', 'skills', linkName);

  beforeAll(async () => {
    projectRoot = await setupTestProjectWithOptionsAsync('skills-actions', 'with-blank', {
      reuseExisting: false,
    });
    await addSkillDependencyAsync(projectRoot, 'test-skills', ['alpha', 'beta']);
  });

  it('links skills with `npx expo skills --agent claude-code`', async () => {
    const results = await executeExpoAsync(projectRoot, ['skills', '--agent', 'claude-code']);

    expect(results.stdout).toContain(`+ ${path.join('.claude', 'skills', 'alpha')}`);
    expect(results.stdout).toContain(`+ ${path.join('.claude', 'skills', 'beta')}`);
    expect(results.stdout).toContain('2 skill(s) from 1 package(s) linked for: Claude Code');

    expect(fs.lstatSync(linkPath('alpha')).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(path.join(linkPath('alpha'), 'SKILL.md'), 'utf8')).toContain(
      'Body of alpha'
    );
    const gitIgnore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
    expect(gitIgnore).toContain('# @generated expo skills start');
    expect(gitIgnore).toContain('.claude/skills/alpha');
    expect(gitIgnore).toContain('.claude/skills/beta');

    // The explicit --agent selection becomes the cache for later auto-syncs
    expect(
      JSON.parse(fs.readFileSync(path.join(projectRoot, '.expo/agent-skill-links.json'), 'utf8'))
    ).toEqual({ agents: ['claude-code'] });
  });

  it('creates nothing on a repeated run', async () => {
    const results = await executeExpoAsync(projectRoot, ['skills', '--agent', 'claude-code']);

    expect(results.stdout).not.toContain('+ ');
    expect(results.stdout).toContain('2 skill(s) from 1 package(s) linked for: Claude Code');
  });

  it('lists skills with `npx expo skills list`', async () => {
    const results = await executeExpoAsync(projectRoot, ['skills', 'list']);

    expect(results.stdout).toContain('test-skills');
    expect(results.stdout).toContain('alpha');
    expect(results.stdout).toContain('linked in .claude/skills');
    expect(results.stdout).toContain('Description for alpha');
  });

  it('outputs skill metadata with `npx expo skills list --json`', async () => {
    const results = await executeExpoAsync(projectRoot, ['skills', 'list', '--json']);

    expect(JSON.parse(results.stdout)).toEqual([
      expect.objectContaining({
        package: 'test-skills',
        skill: 'alpha',
        name: 'Skill alpha',
        description: 'Description for alpha',
        linkName: 'alpha',
        linkedIn: ['.claude/skills'],
      }),
      expect.objectContaining({
        package: 'test-skills',
        skill: 'beta',
        linkName: 'beta',
        linkedIn: ['.claude/skills'],
      }),
    ]);
  });

  it('prints every SKILL.md of a package with `npx expo skills show`', async () => {
    const results = await executeExpoAsync(projectRoot, ['skills', 'show', 'test-skills']);

    expect(results.stdout).toContain('--- test-skills/skills/alpha/SKILL.md ---');
    expect(results.stdout).toContain('Body of alpha');
    expect(results.stdout).toContain('Body of beta');
  });

  it('prints a single SKILL.md with `npx expo skills show <package> <skill>`', async () => {
    const results = await executeExpoAsync(projectRoot, ['skills', 'show', 'test-skills', 'alpha']);

    expect(results.stdout).toContain('Body of alpha');
    expect(results.stdout).not.toContain('Body of beta');
    expect(results.stdout).not.toContain('--- test-skills');
  });

  it('fails to show a package without skills', async () => {
    await expect(
      executeExpoAsync(projectRoot, ['skills', 'show', 'unknown-package'], { verbose: false })
    ).rejects.toThrow(/No skills found for "unknown-package"/);
  });

  it('prunes links of removed skills on sync', async () => {
    await fs.promises.rm(path.join(projectRoot, 'node_modules', 'test-skills', 'skills', 'beta'), {
      recursive: true,
      force: true,
    });

    const results = await executeExpoAsync(projectRoot, ['skills', '--agent', 'claude-code']);

    expect(results.stdout).toContain(`- ${path.join('.claude', 'skills', 'beta')}`);
    expect(fs.existsSync(linkPath('beta'))).toBe(false);
    expect(fs.existsSync(linkPath('alpha'))).toBe(true);
  });

  it('previews changes with `npx expo skills clean --dry-run`', async () => {
    const results = await executeExpoAsync(projectRoot, ['skills', 'clean', '--dry-run']);

    expect(results.stdout).toContain('[dry-run]');
    expect(fs.existsSync(linkPath('alpha'))).toBe(true);
  });

  it('removes managed links with `npx expo skills clean`', async () => {
    const userSkillDir = path.join(projectRoot, '.claude', 'skills', 'my-own-skill');
    await fs.promises.mkdir(userSkillDir, { recursive: true });

    const results = await executeExpoAsync(projectRoot, ['skills', 'clean']);

    expect(results.stdout).toContain('Removed 1 managed skill link(s)');
    expect(fs.existsSync(linkPath('alpha'))).toBe(false);
    expect(fs.existsSync(userSkillDir)).toBe(true);
    expect(fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8')).not.toContain(
      '.claude/skills/alpha'
    );
  });
});

// Due to change in `expo` package the tests suit will fail on Windows, as npm pack fails to execute `expo` prepare on Windows.
const describeSkipWin = process.platform === 'win32' ? describe.skip : describe;

describeSkipWin('auto sync on `npx expo start`', () => {
  let projectRoot: string;
  let linkPath: string;

  beforeAll(async () => {
    projectRoot = await setupTestProjectWithOptionsAsync('skills-autosync-start', 'with-blank', {
      reuseExisting: false,
      linkExpoPackages: ['expo', 'babel-preset-expo'],
    });
    await addSkillDependencyAsync(projectRoot, 'test-skills', ['alpha']);

    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf8'));
    pkg.expo = { skills: { autoSync: true, agents: ['claude-code'] } };
    await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2));

    linkPath = path.join(projectRoot, '.claude', 'skills', 'npm-test-skills-alpha');
  });

  it('links skills in the background', async () => {
    const expo = createExpoStart({ cwd: projectRoot });
    await expo.startAsync();
    try {
      await waitForAsync(() => fs.existsSync(linkPath), 30000);
      expect(fs.existsSync(linkPath)).toBe(true);
    } finally {
      await expo.stopAsync();
    }
  });

  it('skips linking with --no-agent-skills', async () => {
    await executeExpoAsync(projectRoot, ['skills', 'clean']);

    const expo = createExpoStart({
      cwd: projectRoot,
      command: (port) => [bin, 'start', `--port=${port}`, '--no-agent-skills'],
    });
    await expo.startAsync();
    try {
      // The sync starts before the dev server is ready, give it time to finish if it wrongly runs.
      await waitForAsync(() => fs.existsSync(linkPath), 5000);
      expect(fs.existsSync(linkPath)).toBe(false);
    } finally {
      await expo.stopAsync();
    }
  });
});

async function waitForAsync(check: () => boolean, timeoutMs: number): Promise<void> {
  const endTime = Date.now() + timeoutMs;
  while (!check() && Date.now() < endTime) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
