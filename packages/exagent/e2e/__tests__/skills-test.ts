/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { executeExagentAsync, readProjectFile, setupFixtureAsync } from '../utils';

const CLAUDE_SKILLS_DIR = path.join('.claude', 'skills');
const AGENTS_SKILLS_DIR = path.join('.agents', 'skills');

describe('exagent skills', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('prints usage with `skills --help`', async () => {
    const result = await executeExagentAsync(projectRoot, ['skills', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('sync');
    expect(result.all).toContain('list');
    expect(result.all).toContain('show');
    expect(result.all).toContain('clean');
    expect(result.all).toContain('--agent');
  });

  it('reports the discovered skill with `skills list`', async () => {
    const result = await executeExagentAsync(projectRoot, ['skills', 'list']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('fake-module-with-skills');
    expect(result.stdout).toContain('usage');
    expect(result.stdout).toContain('Use the fake module in an Expo app.');
    // A package without a `skills` directory is not a skill provider.
    expect(result.stdout).not.toContain('fake-module-plain');
  });

  it('reports skill metadata with `skills list --json`', async () => {
    const result = await executeExagentAsync(projectRoot, ['skills', 'list', '--json']);

    expect(JSON.parse(result.stdout)).toEqual([
      expect.objectContaining({
        package: 'fake-module-with-skills',
        skill: 'usage',
        name: 'Fake Module Usage',
        description: expect.stringContaining('Use the fake module in an Expo app.'),
        linkName: 'usage',
        linkedIn: [],
      }),
    ]);
  });

  it('prints the SKILL.md contents with `skills show`', async () => {
    const result = await executeExagentAsync(projectRoot, [
      'skills',
      'show',
      'fake-module-with-skills',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Body of usage skill.');
  });

  it('fails `skills show` for a package without skills', async () => {
    const result = await executeExagentAsync(projectRoot, ['skills', 'show', 'fake-module-plain'], {
      reject: false,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.all).toContain('fake-module-plain');
  });

  it('fails on an unknown action', async () => {
    const result = await executeExagentAsync(projectRoot, ['skills', 'nope'], {
      reject: false,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.all).toContain('nope');
  });

  describe('sync', () => {
    const linkPath = (dir: string, name = 'usage') => path.join(dir, name);

    it('links skills with `skills sync --agent claude-code`', async () => {
      const result = await executeExagentAsync(projectRoot, [
        'skills',
        'sync',
        '--agent',
        'claude-code',
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(`+ ${linkPath(CLAUDE_SKILLS_DIR)}`);

      const link = path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage');
      expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
      // The link resolves into the package that ships the skill.
      expect(fs.readFileSync(path.join(link, 'SKILL.md'), 'utf8')).toContain(
        'Body of usage skill.'
      );
      expect(fs.realpathSync(link)).toBe(
        fs.realpathSync(
          path.join(projectRoot, 'node_modules', 'fake-module-with-skills', 'skills', 'usage')
        )
      );
    });

    it('treats `skills` without an action as `skills sync`', async () => {
      const result = await executeExagentAsync(projectRoot, ['skills', '--agent', 'claude-code']);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(true);
    });

    it('maintains a generated .gitignore block', async () => {
      await executeExagentAsync(projectRoot, ['skills', '--agent', 'claude-code']);

      const gitIgnore = readProjectFile(projectRoot, '.gitignore');
      expect(gitIgnore).toContain('# @generated expo skills start');
      expect(gitIgnore).toContain('.claude/skills/usage');
      expect(gitIgnore).toContain('# @generated expo skills end');
    });

    it('caches the explicit agent selection', async () => {
      await executeExagentAsync(projectRoot, ['skills', '--agent', 'claude-code']);

      expect(JSON.parse(readProjectFile(projectRoot, '.expo', 'agent-skill-links.json')!)).toEqual({
        agents: ['claude-code'],
      });
    });

    it('links into the shared agents directory with `--agent cursor`', async () => {
      await executeExagentAsync(projectRoot, ['skills', '--agent', 'cursor']);

      expect(fs.existsSync(path.join(projectRoot, AGENTS_SKILLS_DIR, 'usage'))).toBe(true);
    });

    it('creates nothing on a repeated run', async () => {
      await executeExagentAsync(projectRoot, ['skills', '--agent', 'claude-code']);
      const result = await executeExagentAsync(projectRoot, ['skills', '--agent', 'claude-code']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('+ ');
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(true);
    });

    it('changes nothing with `--dry-run`', async () => {
      const result = await executeExagentAsync(projectRoot, [
        'skills',
        '--agent',
        'claude-code',
        '--dry-run',
      ]);

      expect(result.stdout).toContain('[dry-run]');
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(false);
      expect(readProjectFile(projectRoot, '.gitignore')).not.toContain('.claude/skills/usage');
    });

    it('prunes the link of a removed skill', async () => {
      await executeExagentAsync(projectRoot, ['skills', '--agent', 'claude-code']);
      await fs.promises.rm(
        path.join(projectRoot, 'node_modules', 'fake-module-with-skills', 'skills', 'usage'),
        { recursive: true, force: true }
      );

      const result = await executeExagentAsync(projectRoot, ['skills', '--agent', 'claude-code']);

      expect(result.stdout).toContain(`- ${linkPath(CLAUDE_SKILLS_DIR)}`);
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(false);
      expect(readProjectFile(projectRoot, '.gitignore')).not.toContain('.claude/skills/usage');
    });
  });

  describe('clean', () => {
    beforeEach(async () => {
      await executeExagentAsync(projectRoot, ['skills', '--agent', 'claude-code']);
    });

    it('removes the managed links and their .gitignore entries', async () => {
      const result = await executeExagentAsync(projectRoot, ['skills', 'clean']);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(false);
      expect(readProjectFile(projectRoot, '.gitignore')).not.toContain('.claude/skills/usage');
    });

    it('keeps skills the user owns', async () => {
      const userSkill = path.join(projectRoot, CLAUDE_SKILLS_DIR, 'my-own-skill');
      await fs.promises.mkdir(userSkill, { recursive: true });

      await executeExagentAsync(projectRoot, ['skills', 'clean']);

      expect(fs.existsSync(userSkill)).toBe(true);
    });

    it('changes nothing with `--dry-run`', async () => {
      const result = await executeExagentAsync(projectRoot, ['skills', 'clean', '--dry-run']);

      expect(result.stdout).toContain('[dry-run]');
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(true);
    });
  });
});

describe('exagent', () => {
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('prints usage with `--help`', async () => {
    const result = await executeExagentAsync(projectRoot, ['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('skills');
    expect(result.all).toContain('install');
    expect(result.all).toContain('start');
  });

  it('prints the package version with `--version`', async () => {
    const result = await executeExagentAsync(projectRoot, ['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(require('../../package.json').version);
  });
});
