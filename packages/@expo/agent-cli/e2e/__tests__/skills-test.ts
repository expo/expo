/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { executeAgentCliAsync, readProjectFile, setupFixtureAsync } from '../utils';

const CLAUDE_SKILLS_DIR = path.join('.claude', 'skills');
const AGENTS_SKILLS_DIR = path.join('.agents', 'skills');

describe('@expo/agent-cli skills', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('lists the actions of the group with `skills --help`, then the default action’s options', async () => {
    const result = await executeAgentCliAsync(projectRoot, ['skills', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('skills:sync');
    expect(result.all).toContain('skills:list');
    expect(result.all).toContain('skills:show');
    expect(result.all).toContain('skills:clean');
    // `@expo/agent-cli skills` runs `skills:sync`, so its options are documented here too.
    expect(result.all).toContain('--agent');
    expect(result.all).toContain('--dry-run');
  });

  it('prints the options of an action with `skills:sync --help`', async () => {
    const result = await executeAgentCliAsync(projectRoot, ['skills:sync', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--agent');
    expect(result.all).toContain('--dry-run');
  });

  it('reports the discovered skill with `skills:list`', async () => {
    const result = await executeAgentCliAsync(projectRoot, ['skills:list']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('fake-module-with-skills');
    expect(result.stdout).toContain('usage');
    expect(result.stdout).toContain('Use the fake module in an Expo app.');
    // A package without a `skills` directory is not a skill provider.
    expect(result.stdout).not.toContain('fake-module-plain');
  });

  it('reports skill metadata with `skills:list --json`', async () => {
    const result = await executeAgentCliAsync(projectRoot, ['skills:list', '--json']);

    // One object on stdout, never a bare array (llp/0006 §Output contract).
    expect(JSON.parse(result.stdout)).toEqual({
      skills: [
        expect.objectContaining({
          package: 'fake-module-with-skills',
          skill: 'usage',
          name: 'Fake Module Usage',
          description: expect.stringContaining('Use the fake module in an Expo app.'),
          linkName: 'usage',
          linkedIn: [],
        }),
      ],
    });
  });

  it('prints the SKILL.md contents with `skills:show`', async () => {
    const result = await executeAgentCliAsync(projectRoot, [
      'skills:show',
      'fake-module-with-skills',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Body of usage skill.');
  });

  it('fails `skills:show` for a package without skills', async () => {
    const result = await executeAgentCliAsync(projectRoot, ['skills:show', 'fake-module-plain'], {
      reject: false,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.all).toContain('fake-module-plain');
  });

  it('fails on an unknown action, after listing the ones there are', async () => {
    const result = await executeAgentCliAsync(projectRoot, ['skills:nope'], {
      reject: false,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.all).toContain('nope');
    // The listing first, the recovery command last: the last line is what an agent acts on.
    expect(result.all).toContain('skills:sync');
    expect(result.all).toContain('Try: npx @expo/agent-cli skills --help');
  });

  describe('sync', () => {
    const linkPath = (dir: string, name = 'usage') => path.join(dir, name);

    it('links skills with `skills:sync --agent claude-code`', async () => {
      const result = await executeAgentCliAsync(projectRoot, [
        'skills:sync',
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

    // F131 [live, wave 31]: the guard that refuses to replace a directory the user created worked,
    // and the run reported `linked: []`, `removed: []` and nothing else, so the object an agent
    // parses said "there was nothing to do" about a run in which a skill this project ships is not
    // linked and only the user can unblock it
    // [`wave31-open-cells/evidence/44-skills-sync-collision.out`, beside the warning that went to
    // stderr]. Read the two together and the report is worse than silence: it is reassuring.
    it('reports a skill it could not link because the name is taken', async () => {
      const own = path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage');
      await fs.promises.mkdir(own, { recursive: true });
      await fs.promises.writeFile(path.join(own, 'SKILL.md'), '# my own skill\n');

      const result = await executeAgentCliAsync(projectRoot, [
        'skills:sync',
        '--agent',
        'claude-code',
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.linked).toEqual([]);
      expect(payload.removed).toEqual([]);
      expect(payload.skipped).toEqual([
        {
          link: linkPath(CLAUDE_SKILLS_DIR),
          package: 'fake-module-with-skills',
          skill: 'usage',
          reason: 'occupied',
        },
      ]);
      // The user's file is what the guard exists for, and it is untouched.
      expect(await fs.promises.readFile(path.join(own, 'SKILL.md'), 'utf8')).toBe(
        '# my own skill\n'
      );
      // The reason is still on stderr for a person, which is where it always was.
      expect(result.stderr).toContain('was not created by Expo');
    });

    it('says on the human summary that a skill was not linked', async () => {
      const own = path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage');
      await fs.promises.mkdir(own, { recursive: true });
      await fs.promises.writeFile(path.join(own, 'SKILL.md'), '# my own skill\n');

      const result = await executeAgentCliAsync(projectRoot, [
        'skills:sync',
        '--agent',
        'claude-code',
      ]);

      expect(result.exitCode).toBe(0);
      // The line above counts what the project ships and says "linked", which is untrue here, so
      // the correction has to be beside it or the summary reads as "1 skill linked".
      expect(result.stdout).toContain('1 skill(s) from 1 package(s) linked for');
      expect(result.stdout).toContain('1 of those skill(s) is not linked');
      expect(result.stdout).toContain('fake-module-with-skills/usage (occupied)');
    });

    // @ref llp/0009-smart-followups.rfc.md §Examples per command — `skills:sync`.
    it('ends with a Next section pointing at the skill list', async () => {
      const result = await executeAgentCliAsync(projectRoot, [
        'skills:sync',
        '--agent',
        'claude-code',
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Suggested next:');
      expect(result.stdout).toContain('npx @expo/agent-cli skills:list');
    });

    it('leaves the Next section out with --no-followups', async () => {
      const result = await executeAgentCliAsync(projectRoot, [
        'skills:sync',
        '--agent',
        'claude-code',
        '--no-followups',
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('Suggested next:');
    });

    it('emits one cli:followups event for a driving agent', async () => {
      const eventsFile = path.join(projectRoot, 'skills-events.jsonl');
      const result = await executeAgentCliAsync(
        projectRoot,
        ['skills:sync', '--agent', 'claude-code'],
        { env: { LOG_EVENTS: eventsFile } }
      );

      expect(result.exitCode).toBe(0);
      const events = fs
        .readFileSync(eventsFile, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      // `2g` names the event in the `_e` field of every JSONL line.
      const followups = events.filter((entry) => entry._e === 'cli:followups');
      expect(followups).toHaveLength(1);
      expect(followups[0]).toMatchObject({ command: 'skills:sync' });
    });

    it('treats `skills` without an action as `skills:sync`', async () => {
      const result = await executeAgentCliAsync(projectRoot, ['skills', '--agent', 'claude-code']);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(true);
    });

    // The colon is canonical, the space form resolves to the same command: an agent that types
    // `skills sync` is never wrong (llp/0006 §The `@expo/agent-cli` launcher).
    it('resolves the space form `skills sync` to the same command', async () => {
      const result = await executeAgentCliAsync(projectRoot, [
        'skills',
        'sync',
        '--agent',
        'claude-code',
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(true);
      expect(result.stdout).toContain('npx @expo/agent-cli skills:list');
    });

    it('maintains a generated .gitignore block', async () => {
      await executeAgentCliAsync(projectRoot, ['skills:sync', '--agent', 'claude-code']);

      const gitIgnore = readProjectFile(projectRoot, '.gitignore');
      expect(gitIgnore).toContain('# @generated expo skills start');
      expect(gitIgnore).toContain('.claude/skills/usage');
      expect(gitIgnore).toContain('# @generated expo skills end');
    });

    it('caches the explicit agent selection', async () => {
      await executeAgentCliAsync(projectRoot, ['skills:sync', '--agent', 'claude-code']);

      expect(JSON.parse(readProjectFile(projectRoot, '.expo', 'agent-skill-links.json')!)).toEqual({
        agents: ['claude-code'],
      });
    });

    it('links into the shared agents directory with `--agent cursor`', async () => {
      await executeAgentCliAsync(projectRoot, ['skills:sync', '--agent', 'cursor']);

      expect(fs.existsSync(path.join(projectRoot, AGENTS_SKILLS_DIR, 'usage'))).toBe(true);
    });

    it('creates nothing on a repeated run', async () => {
      await executeAgentCliAsync(projectRoot, ['skills:sync', '--agent', 'claude-code']);
      const result = await executeAgentCliAsync(projectRoot, [
        'skills:sync',
        '--agent',
        'claude-code',
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('+ ');
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(true);
    });

    it('changes nothing with `--dry-run`', async () => {
      const result = await executeAgentCliAsync(projectRoot, [
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
      await executeAgentCliAsync(projectRoot, ['skills:sync', '--agent', 'claude-code']);
      await fs.promises.rm(
        path.join(projectRoot, 'node_modules', 'fake-module-with-skills', 'skills', 'usage'),
        { recursive: true, force: true }
      );

      const result = await executeAgentCliAsync(projectRoot, [
        'skills:sync',
        '--agent',
        'claude-code',
      ]);

      expect(result.stdout).toContain(`- ${linkPath(CLAUDE_SKILLS_DIR)}`);
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(false);
      expect(readProjectFile(projectRoot, '.gitignore')).not.toContain('.claude/skills/usage');
    });
  });

  describe('clean', () => {
    beforeEach(async () => {
      await executeAgentCliAsync(projectRoot, ['skills:sync', '--agent', 'claude-code']);
    });

    it('removes the managed links and their .gitignore entries', async () => {
      const result = await executeAgentCliAsync(projectRoot, ['skills:clean']);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(false);
      expect(readProjectFile(projectRoot, '.gitignore')).not.toContain('.claude/skills/usage');
    });

    it('keeps skills the user owns', async () => {
      const userSkill = path.join(projectRoot, CLAUDE_SKILLS_DIR, 'my-own-skill');
      await fs.promises.mkdir(userSkill, { recursive: true });

      await executeAgentCliAsync(projectRoot, ['skills:clean']);

      expect(fs.existsSync(userSkill)).toBe(true);
    });

    it('changes nothing with `--dry-run`', async () => {
      const result = await executeAgentCliAsync(projectRoot, ['skills:clean', '--dry-run']);

      expect(result.stdout).toContain('[dry-run]');
      expect(fs.existsSync(path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage'))).toBe(true);
    });
  });
});

describe('@expo/agent-cli', () => {
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  // The top-level listing is grouped by the job at hand, not alphabetically: an agent reading it
  // has to be able to pick a command (llp/0006 §The `@expo/agent-cli` launcher).
  //
  // @ref llp/0024-cli-ui.rfc.md §The workflow map
  // The sections were renamed and the commands are one line each with their summary, so the
  // assertion is on the section titles and on every command being present — which is what this
  // test was always for. The comma-joined line it used to pin was the rendering, not the rule.
  it('prints the sectioned command listing with `--help`', async () => {
    const result = await executeAgentCliAsync(projectRoot, ['--help']);

    expect(result.exitCode).toBe(0);
    for (const title of [
      'Develop',
      'Understand the project',
      'Debug a running app',
      'Create a project',
      'Deployment',
      'Agent setup',
      'Learn',
      'Expo CLI (fallback to npx expo <command>)',
    ]) {
      expect(result.all).toContain(title);
    }
    for (const command of [
      'dev',
      'dev:logs',
      'dev:stop',
      'typecheck',
      'start',
      'install',
      'status',
      'new',
      'deploy',
      'runtime:eval',
      'runtime:errors',
      'runtime:reload',
      'runtime:stop',
      'navigate',
      'agents:setup',
      'skills:sync',
      'help',
    ]) {
      expect(result.all).toContain(command);
    }
  });

  // @ref llp/0024-cli-ui.rfc.md §The workflow map
  // The listing says which commands exist; the map above it says which one to run first, and the
  // on-ramp under the map teaches the protocol. A caller who has never seen this CLI needs all
  // three, in that order, on the first screen they are given.
  it('puts the on-ramp above the listing, and leaves the steps to it', async () => {
    const result = await executeAgentCliAsync(projectRoot, ['--help']);

    expect(result.exitCode).toBe(0);
    // The map lives in `help workflow` alone [confirmed — Kudo, 2026-08-28].
    expect(result.all).not.toContain('What to run, in order');
    expect(result.all).toContain('New here? npx @expo/agent-cli help workflow');
    const topic = await executeAgentCliAsync(projectRoot, ['help', 'workflow']);
    for (const title of [
      'Check the project',
      'Start the app',
      'Edit and reload',
      "Verify before you're done",
      'Deploy',
      'One-time setup',
    ]) {
      expect(topic.all).toContain(title);
    }
    expect(result.all.indexOf('What to run, in order')).toBeLessThan(
      result.all.indexOf('Develop')
    );
  });

  it('prints the package version with `--version`', async () => {
    const result = await executeAgentCliAsync(projectRoot, ['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(require('../../package.json').version);
  });
});
