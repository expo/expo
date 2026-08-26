import { vol } from 'memfs';

import * as Log from '../../log';
import { probeProjectStateAsync } from '../../project/probe';
import type { ProjectState } from '../../project/types';
import { resolveAgentsAsync, getPersistedAgentIdsAsync } from '../../skills/agents';
import { discoverSkillsAsync } from '../../skills/discovery';
import { syncSkillsAsync } from '../../skills/skillsAsync';
import type { DiscoveredSkill } from '../../skills/types';
import { event } from '../events';
import { printSetupAsync, runSetupAsync } from '../setupAsync';
import type { SetupOptions } from '../types';

jest.mock('../../log');
jest.mock('../events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../../project/probe', () => ({ probeProjectStateAsync: jest.fn() }));
jest.mock('../../skills/skillsAsync', () => ({ syncSkillsAsync: jest.fn() }));
jest.mock('../../skills/discovery', () => ({ discoverSkillsAsync: jest.fn(async () => []) }));
jest.mock('../../skills/agents', () => ({
  ...jest.requireActual('../../skills/agents'),
  resolveAgentsAsync: jest.fn(),
  getPersistedAgentIdsAsync: jest.fn(async () => null),
  detectInstalledAgentsAsync: jest.fn(async () => []),
}));

const projectRoot = '/project';

const claudeCode = { id: 'claude-code', displayName: 'Claude Code', skillsDir: '.claude/skills' };

const usageSkill: DiscoveredSkill = {
  name: 'usage',
  path: '/project/node_modules/fake-module-with-skills/skills/usage',
  packageName: 'fake-module-with-skills',
  linkName: 'usage',
};

function options(overrides: Partial<SetupOptions> = {}): SetupOptions {
  return { agents: [], agentsMd: true, agentSkills: true, ...overrides };
}

function mockState(overrides: Partial<ProjectState> = {}): ProjectState {
  const state: ProjectState = {
    projectRoot,
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: false,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: 'abcdef0123456789' },
    ...overrides,
  };
  jest.mocked(probeProjectStateAsync).mockResolvedValue(state);
  return state;
}

beforeEach(() => {
  vol.reset();
  vol.fromJSON({ '/project/package.json': JSON.stringify({ name: 'my-app' }) });
  mockState();
  jest.mocked(discoverSkillsAsync).mockResolvedValue([usageSkill]);
  jest.mocked(resolveAgentsAsync).mockResolvedValue({ agents: [claudeCode], source: 'flags' });
});

describe(runSetupAsync, () => {
  it('should sync the skills and write the managed block', async () => {
    const report = await runSetupAsync(projectRoot, options({ agents: ['claude-code'] }));

    expect(report).toEqual({
      projectRoot,
      agents: ['claude-code'],
      skills: {
        synced: true,
        discovered: 1,
        packages: 1,
        agents: ['claude-code'],
        skillsDirs: ['.claude/skills'],
      },
      agentsMd: { path: 'AGENTS.md', action: 'created' },
      notes: [],
    });
    expect(vol.readFileSync('/project/AGENTS.md', 'utf8')).toContain(
      '<!-- BEGIN EXAGENT MANAGED BLOCK -->'
    );
  });

  it('should forward the resolved agents to the skill sync, so the selection resolves once', async () => {
    await runSetupAsync(projectRoot, options({ agents: ['claude-code'] }));

    expect(resolveAgentsAsync).toHaveBeenCalledWith(projectRoot, { agents: ['claude-code'] });
    expect(syncSkillsAsync).toHaveBeenCalledWith(projectRoot, {
      agents: ['claude-code'],
      dryRun: false,
    });
  });

  it('should name the linked skills directory in the block', async () => {
    await runSetupAsync(projectRoot, options());

    expect(vol.readFileSync('/project/AGENTS.md', 'utf8')).toContain('.claude/skills');
  });

  it('should report an unchanged block as skipped on a second run', async () => {
    await runSetupAsync(projectRoot, options());
    const first = vol.readFileSync('/project/AGENTS.md', 'utf8');

    const report = await runSetupAsync(projectRoot, options());

    expect(report.agentsMd).toEqual({ path: 'AGENTS.md', action: 'skipped' });
    expect(vol.readFileSync('/project/AGENTS.md', 'utf8')).toBe(first);
  });

  it('should skip the skill sync with agentSkills disabled, and still write the block', async () => {
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValue(['claude-code']);

    const report = await runSetupAsync(projectRoot, options({ agentSkills: false }));

    expect(syncSkillsAsync).not.toHaveBeenCalled();
    expect(resolveAgentsAsync).not.toHaveBeenCalled();
    expect(report.skills).toBeNull();
    // The cached selection still names the directory the skills are linked into.
    expect(report.agents).toEqual(['claude-code']);
    expect(vol.readFileSync('/project/AGENTS.md', 'utf8')).toContain('.claude/skills');
  });

  it('should skip AGENTS.md with agentsMd disabled', async () => {
    const report = await runSetupAsync(projectRoot, options({ agentsMd: false }));

    expect(report.agentsMd).toBeNull();
    expect(vol.existsSync('/project/AGENTS.md')).toBe(false);
    expect(syncSkillsAsync).toHaveBeenCalled();
  });

  it('should never write CLAUDE.md, and note one that does not reference AGENTS.md', async () => {
    vol.writeFileSync('/project/CLAUDE.md', '# Rules\n');

    const report = await runSetupAsync(projectRoot, options());

    expect(vol.readFileSync('/project/CLAUDE.md', 'utf8')).toBe('# Rules\n');
    expect(report.notes).toEqual([expect.stringContaining('CLAUDE.md')]);
  });
});

describe(printSetupAsync, () => {
  it('should print one JSON object with the documented top-level keys', async () => {
    await printSetupAsync(projectRoot, options({ json: true }));

    expect(Log.log).toHaveBeenCalledTimes(1);
    const report = JSON.parse(jest.mocked(Log.log).mock.calls[0]![0]!);
    expect(Object.keys(report).sort()).toEqual([
      'agents',
      'agentsMd',
      'notes',
      'projectRoot',
      'skills',
    ]);
  });

  it('should print a terse text summary by default', async () => {
    await printSetupAsync(projectRoot, options());

    const output = jest
      .mocked(Log.log)
      .mock.calls.map((call) => call.join(' '))
      .join('\n');
    expect(output).toContain('AGENTS.md');
    expect(output).toContain('created');
    expect(output).not.toContain('{');
  });

  it('should emit the summary event', async () => {
    await printSetupAsync(projectRoot, options());

    expect(event).toHaveBeenCalledWith('setup_completed', {
      agents: ['claude-code'],
      skillsSynced: true,
      skillsDiscovered: 1,
      agentsMdAction: 'created',
      noteCount: 0,
    });
  });
});
