/* eslint-env jest */
// @ref llp/0006-agent-native-cli-surface.rfc.md §AGENTS.md generation
//
// `exagent setup` links the agent skills and maintains one managed block in the project's
// AGENTS.md. These tests run it through the CLI it is published as, on a copy of the
// `skills-app` fixture.
import fs from 'node:fs';
import path from 'node:path';

import { executeExagentAsync, readProjectFile, setupFixtureAsync } from '../utils';

const BLOCK_START = '<!-- BEGIN EXAGENT MANAGED BLOCK -->';
const BLOCK_END = '<!-- END EXAGENT MANAGED BLOCK -->';

/** The shape `setup --json` prints, per `src/setup/types.ts`. */
type SetupReport = {
  projectRoot: string;
  skills: {
    synced: boolean;
    discovered: number;
    packages: number;
    agents: string[];
    skillsDirs: string[];
  } | null;
  agentsMd: { path: string; action: 'created' | 'updated' | 'skipped' } | null;
  agents: string[];
  notes: string[];
};

describe('exagent setup', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('prints usage with `setup --help`', async () => {
    const result = await executeExagentAsync(projectRoot, ['setup', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--agent');
    expect(result.all).toContain('--no-agents-md');
    expect(result.all).toContain('--no-agent-skills');
    expect(result.all).toContain('--json');
  });

  it('links the skills and creates AGENTS.md with the managed block', async () => {
    const result = await executeExagentAsync(projectRoot, ['setup', '--agent', 'claude-code']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('AGENTS.md');
    expect(result.stdout).toContain('created');

    // The skill sync of `skills sync` ran.
    expect(fs.existsSync(path.join(projectRoot, '.claude', 'skills', 'usage'))).toBe(true);

    const agentsMd = readProjectFile(projectRoot, 'AGENTS.md')!;
    expect(agentsMd).toContain(BLOCK_START);
    expect(agentsMd).toContain(BLOCK_END);
    // The project facts come from the probe.
    expect(agentsMd).toContain('skills-app');
    expect(agentsMd).toContain('54.0.0');
    expect(agentsMd).toContain('Expo Go');
    // The command cheat sheet.
    expect(agentsMd).toContain('exagent status');
    expect(agentsMd).toContain('exagent context --json');
    expect(agentsMd).toContain('exagent start --plan');
    expect(agentsMd).toContain('exagent install');
    expect(agentsMd).toContain('exagent runtime eval');
    expect(agentsMd).toContain('exagent navigate');
    expect(agentsMd).toContain('exagent skills list');
    // The linked skills location.
    expect(agentsMd).toContain('.claude/skills');
  });

  it('writes a byte-identical AGENTS.md on a rerun', async () => {
    await executeExagentAsync(projectRoot, ['setup', '--agent', 'claude-code']);
    const first = readProjectFile(projectRoot, 'AGENTS.md')!;

    const result = await executeExagentAsync(projectRoot, ['setup', '--agent', 'claude-code']);

    expect(result.exitCode).toBe(0);
    expect(readProjectFile(projectRoot, 'AGENTS.md')).toBe(first);
    expect(result.stdout).toContain('skipped');
  });

  it('preserves user content outside the managed block', async () => {
    const before = ['# House rules', '', 'Never force push.', ''].join('\n');
    await fs.promises.writeFile(path.join(projectRoot, 'AGENTS.md'), before);

    await executeExagentAsync(projectRoot, ['setup', '--agent', 'claude-code']);
    const withBlock = readProjectFile(projectRoot, 'AGENTS.md')!;

    expect(withBlock.startsWith(before)).toBe(true);
    expect(withBlock).toContain(BLOCK_START);

    // A second run rewrites only the block, so the user content stays byte for byte.
    await executeExagentAsync(projectRoot, ['setup', '--agent', 'claude-code']);
    expect(readProjectFile(projectRoot, 'AGENTS.md')).toBe(withBlock);
  });

  it('leaves CLAUDE.md alone and notes that it does not reference AGENTS.md', async () => {
    const claudeMd = '# Rules for this project\n';
    await fs.promises.writeFile(path.join(projectRoot, 'CLAUDE.md'), claudeMd);

    const result = await executeExagentAsync(projectRoot, ['setup', '--agent', 'claude-code']);

    expect(readProjectFile(projectRoot, 'CLAUDE.md')).toBe(claudeMd);
    expect(result.all).toContain('CLAUDE.md');
  });

  it('writes only AGENTS.md with `--no-agent-skills`', async () => {
    const result = await executeExagentAsync(projectRoot, ['setup', '--no-agent-skills']);

    expect(result.exitCode).toBe(0);
    expect(readProjectFile(projectRoot, 'AGENTS.md')).toContain(BLOCK_START);
    expect(fs.existsSync(path.join(projectRoot, '.claude', 'skills', 'usage'))).toBe(false);
  });

  it('links only the skills with `--no-agents-md`', async () => {
    const result = await executeExagentAsync(projectRoot, [
      'setup',
      '--agent',
      'claude-code',
      '--no-agents-md',
    ]);

    expect(result.exitCode).toBe(0);
    expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(false);
    expect(fs.existsSync(path.join(projectRoot, '.claude', 'skills', 'usage'))).toBe(true);
  });

  it('prints exactly one JSON object with `--json`', async () => {
    const result = await executeExagentAsync(projectRoot, [
      'setup',
      '--agent',
      'claude-code',
      '--json',
    ]);

    expect(result.exitCode).toBe(0);
    const report: SetupReport = JSON.parse(result.stdout);
    // Top-level keys are the stable contract of the command (llp/0006 §Output contract).
    expect(Object.keys(report).sort()).toEqual([
      'agents',
      'agentsMd',
      'notes',
      'projectRoot',
      'skills',
    ]);
    expect(report.agents).toEqual(['claude-code']);
    expect(report.agentsMd).toEqual({ path: 'AGENTS.md', action: 'created' });
    expect(report.skills).toEqual({
      synced: true,
      discovered: 1,
      packages: 1,
      agents: ['claude-code'],
      skillsDirs: ['.claude/skills'],
    });
  });

  it('reports an unknown agent', async () => {
    const result = await executeExagentAsync(projectRoot, ['setup', '--agent', 'nope'], {
      reject: false,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.all).toContain('nope');
  });
});
