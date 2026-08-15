import { vol } from 'memfs';

import * as Log from '../../log';
import { getAgentTelemetryContext } from '../../utils/telemetry/utils/agent';
import {
  detectInstalledAgentsAsync,
  getAllAgents,
  getPersistedAgentIdsAsync,
  persistAgentSelectionAsync,
  resolveAgentsAsync,
} from '../agents';
import { discoverSkillsAsync } from '../discovery';
import { cleanSkillLinksAsync, syncSkillLinksAsync, updateGitIgnoreAsync } from '../linking';
import {
  autoSyncSkillsAsync,
  cleanSkillsAsync,
  listSkillsAsync,
  printSkillsForAgentAsync,
  showSkillsAsync,
  syncSkillsAsync,
} from '../skillsAsync';
import type { DiscoveredSkill, SkillsAgent } from '../types';

jest.mock('../../log');
jest.mock('../../utils/telemetry/utils/agent', () => ({
  getAgentTelemetryContext: jest.fn(() => null),
}));
jest.mock('../discovery', () => ({ discoverSkillsAsync: jest.fn() }));
jest.mock('../agents', () => ({
  getAllAgents: jest.fn(),
  detectInstalledAgentsAsync: jest.fn(),
  getPersistedAgentIdsAsync: jest.fn(),
  resolveAgentsAsync: jest.fn(),
  persistAgentSelectionAsync: jest.fn(),
}));
jest.mock('../linking', () => ({
  syncSkillLinksAsync: jest.fn(),
  cleanSkillLinksAsync: jest.fn(),
  updateGitIgnoreAsync: jest.fn(),
}));

const claudeAgent: SkillsAgent = {
  id: 'claude-code',
  displayName: 'Claude Code',
  skillsDir: '.claude/skills',
};
const cursorAgent: SkillsAgent = {
  id: 'cursor',
  displayName: 'Cursor',
  skillsDir: '.agents/skills',
};
const codexAgent: SkillsAgent = {
  id: 'codex',
  displayName: 'Codex',
  skillsDir: '.agents/skills',
};

const testSkill: DiscoveredSkill = {
  name: 'my-skill',
  path: '/root/node_modules/@acme/tool/skills/my-skill',
  packageName: '@acme/tool',
  linkName: 'my-skill',
};

beforeEach(() => {
  // The sync refreshes the gitignore block for every known agent directory.
  jest.mocked(getAllAgents).mockReturnValue([claudeAgent, cursorAgent, codexAgent]);
});

describe('syncSkillsAsync', () => {
  afterEach(() => vol.reset());

  it('should link discovered skills into deduped agent directories', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent, cursorAgent, codexAgent],
      source: 'cache',
    });
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: ['x'], pruned: [] });

    await syncSkillsAsync('/root', { agents: [], dryRun: false });

    expect(syncSkillLinksAsync).toHaveBeenCalledWith(
      '/root',
      [testSkill],
      ['.claude/skills', '.agents/skills'],
      { dryRun: false }
    );
  });

  it('should persist agent selection when it came from the prompt', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent],
      source: 'prompt',
    });
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await syncSkillsAsync('/root', { agents: [], dryRun: false });

    expect(persistAgentSelectionAsync).toHaveBeenCalledWith('/root', [claudeAgent]);
  });

  it('should persist the selection from --agent flags as the new cache', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [cursorAgent],
      source: 'flags',
    });
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await syncSkillsAsync('/root', { agents: ['cursor'], dryRun: false });

    expect(persistAgentSelectionAsync).toHaveBeenCalledWith('/root', [cursorAgent]);
  });

  it('should not persist agent selection when resolved from the cache or detection', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent],
      source: 'cache',
    });
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await syncSkillsAsync('/root', { agents: [], dryRun: false });

    expect(persistAgentSelectionAsync).not.toHaveBeenCalled();
  });

  it('should refresh the gitignore block for all known agent directories', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent],
      source: 'cache',
    });
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent, cursorAgent]);
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: ['x'], pruned: [] });

    await syncSkillsAsync('/root', { agents: [], dryRun: false });

    expect(updateGitIgnoreAsync).toHaveBeenCalledWith(
      '/root',
      ['.claude/skills', '.agents/skills'],
      { dryRun: false }
    );
  });

  it('should not persist agent selection during a dry run', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent],
      source: 'prompt',
    });
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: ['x'], pruned: [] });

    await syncSkillsAsync('/root', { agents: [], dryRun: true });

    expect(persistAgentSelectionAsync).not.toHaveBeenCalled();
    expect(syncSkillLinksAsync).toHaveBeenCalledWith('/root', [testSkill], ['.claude/skills'], {
      dryRun: true,
    });
  });

  it('should return early when no skills exist and no agents are configured', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([]);
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(null);

    await syncSkillsAsync('/root', { agents: [], dryRun: false });

    expect(resolveAgentsAsync).not.toHaveBeenCalled();
    expect(syncSkillLinksAsync).not.toHaveBeenCalled();
  });

  it('should still prune stale links when no skills exist but agents are configured', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([]);
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(['claude-code']);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent],
      source: 'cache',
    });
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: ['stale'] });

    await syncSkillsAsync('/root', { agents: [], dryRun: false });

    expect(syncSkillLinksAsync).toHaveBeenCalledWith('/root', [], ['.claude/skills'], {
      dryRun: false,
    });
  });
});

describe('listSkillsAsync', () => {
  afterEach(() => vol.reset());

  it('should not throw when no skills are discovered', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([]);
    await expect(listSkillsAsync('/root')).resolves.toBeUndefined();
  });

  it('should list discovered skills without prompting', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(null);
    jest.mocked(detectInstalledAgentsAsync).mockResolvedValueOnce([claudeAgent]);

    await listSkillsAsync('/root');

    expect(resolveAgentsAsync).not.toHaveBeenCalled();
  });
});

describe('listSkillsAsync with json output', () => {
  afterEach(() => vol.reset());

  it('should print machine readable skill metadata', async () => {
    vol.fromJSON({ '/root/.claude/skills/my-skill/SKILL.md': '# my-skill' });
    jest
      .mocked(discoverSkillsAsync)
      .mockResolvedValueOnce([{ ...testSkill, title: 'My skill', description: 'Does things' }]);
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(['claude-code']);
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent]);

    await listSkillsAsync('/root', { json: true });

    const output = jest.mocked(Log.log).mock.calls.at(-1)?.[0];
    expect(JSON.parse(output!)).toEqual([
      {
        package: '@acme/tool',
        skill: 'my-skill',
        name: 'My skill',
        description: 'Does things',
        path: testSkill.path,
        linkName: 'my-skill',
        linkedIn: ['.claude/skills'],
      },
    ]);
  });

  it('should print an empty json array when nothing is discovered', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([]);
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(null);
    jest.mocked(detectInstalledAgentsAsync).mockResolvedValueOnce([]);

    await listSkillsAsync('/root', { json: true });

    const output = jest.mocked(Log.log).mock.calls.at(-1)?.[0];
    expect(JSON.parse(output!)).toEqual([]);
  });
});

describe('showSkillsAsync', () => {
  afterEach(() => vol.reset());

  it('should print the skill contents for a package', async () => {
    vol.fromJSON({
      '/root/node_modules/@acme/tool/skills/my-skill/SKILL.md': '---\nname: my-skill\n---\nBody',
    });
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);

    await showSkillsAsync('/root', '@acme/tool');

    const output = jest
      .mocked(Log.log)
      .mock.calls.map((call) => call[0])
      .join('\n');
    expect(output).toContain('Body');
  });

  it('should filter to a single skill by name', async () => {
    const secondSkill: DiscoveredSkill = {
      name: 'second-skill',
      path: '/root/node_modules/@acme/tool/skills/second-skill',
      packageName: '@acme/tool',
      linkName: 'second-skill',
    };
    vol.fromJSON({
      '/root/node_modules/@acme/tool/skills/my-skill/SKILL.md': 'First body',
      '/root/node_modules/@acme/tool/skills/second-skill/SKILL.md': 'Second body',
    });
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill, secondSkill]);

    await showSkillsAsync('/root', '@acme/tool', 'second-skill');

    const output = jest
      .mocked(Log.log)
      .mock.calls.map((call) => call[0])
      .join('\n');
    expect(output).toContain('Second body');
    expect(output).not.toContain('First body');
  });

  it('should throw when the package ships no skills', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);

    await expect(showSkillsAsync('/root', 'expo-sqlite')).rejects.toThrow(
      /No skills found for "expo-sqlite"/
    );
  });

  it('should throw and list available names when the skill name is unknown', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);

    await expect(showSkillsAsync('/root', '@acme/tool', 'bogus')).rejects.toThrow(/my-skill/);
  });
});

describe('cleanSkillsAsync', () => {
  afterEach(() => vol.reset());

  it('should clean managed links from all known agent directories', async () => {
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent, cursorAgent, codexAgent]);
    jest.mocked(cleanSkillLinksAsync).mockResolvedValueOnce({ pruned: [] });

    await cleanSkillsAsync('/root', { agents: [], dryRun: false });

    expect(cleanSkillLinksAsync).toHaveBeenCalledWith(
      '/root',
      ['.claude/skills', '.agents/skills'],
      { dryRun: false }
    );
  });
});

describe('autoSyncSkillsAsync', () => {
  it('should do nothing when no agent selection is cached', async () => {
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(null);

    await autoSyncSkillsAsync('/root');

    expect(discoverSkillsAsync).not.toHaveBeenCalled();
    expect(syncSkillLinksAsync).not.toHaveBeenCalled();
  });

  it('should not sync when no selection is cached even if agents are detected', async () => {
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(null);
    jest.mocked(detectInstalledAgentsAsync).mockResolvedValueOnce([cursorAgent]);

    await autoSyncSkillsAsync('/root');

    expect(syncSkillLinksAsync).not.toHaveBeenCalled();
  });

  it('should sync without prompting for the cached agents', async () => {
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(['claude-code']);
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent, cursorAgent, codexAgent]);
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: ['x'], pruned: [] });

    await autoSyncSkillsAsync('/root');

    expect(resolveAgentsAsync).not.toHaveBeenCalled();
    expect(syncSkillLinksAsync).toHaveBeenCalledWith('/root', [testSkill], ['.claude/skills'], {});
  });

  it('should only link skills from the given packages and skip pruning', async () => {
    const otherSkill: DiscoveredSkill = {
      name: 'other-skill',
      path: '/root/node_modules/other/skills/other-skill',
      packageName: 'other',
      linkName: 'other-skill',
    };
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(['claude-code']);
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent]);
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill, otherSkill]);
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await autoSyncSkillsAsync('/root', { packages: ['@acme/tool'] });

    expect(syncSkillLinksAsync).toHaveBeenCalledWith('/root', [testSkill], ['.claude/skills'], {
      prune: false,
    });
  });

  it('should parse versioned package specs when scoping the sync', async () => {
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(['claude-code']);
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent]);
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await autoSyncSkillsAsync('/root', { packages: ['@acme/tool@~1.2.0'] });

    expect(syncSkillLinksAsync).toHaveBeenCalledWith('/root', [testSkill], ['.claude/skills'], {
      prune: false,
    });
  });

  it('should warn instead of throwing when the sync fails', async () => {
    jest.mocked(getPersistedAgentIdsAsync).mockResolvedValueOnce(['claude-code']);
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent]);
    jest.mocked(discoverSkillsAsync).mockRejectedValueOnce(new Error('boom'));

    await expect(autoSyncSkillsAsync('/root')).resolves.toBeUndefined();
    expect(syncSkillLinksAsync).not.toHaveBeenCalled();
  });
});

describe('printSkillsForAgentAsync', () => {
  afterEach(() => vol.reset());

  it('should do nothing when no agent is detected', async () => {
    jest.mocked(getAgentTelemetryContext).mockReturnValueOnce(null);

    await printSkillsForAgentAsync('/root', { packages: ['@acme/tool'] });

    expect(discoverSkillsAsync).not.toHaveBeenCalled();
    expect(Log.log).not.toHaveBeenCalled();
  });

  it('should print skill contents of the installed packages', async () => {
    jest
      .mocked(getAgentTelemetryContext)
      .mockReturnValueOnce({ id: 'claude-code', sessionId: undefined });
    vol.fromJSON({ '/root/node_modules/@acme/tool/skills/my-skill/SKILL.md': '# Skill body' });
    const otherSkill: DiscoveredSkill = {
      name: 'other-skill',
      path: '/root/node_modules/other/skills/other-skill',
      packageName: 'other',
      linkName: 'npm-other-other-skill',
    };
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill, otherSkill]);

    await printSkillsForAgentAsync('/root', { packages: ['@acme/tool@~1.2.0'] });

    const output = jest.mocked(Log.log).mock.calls.flat().join('\n');
    expect(output).toContain('--- @acme/tool/skills/my-skill/SKILL.md ---');
    expect(output).toContain('# Skill body');
    expect(output).not.toContain('other-skill');
  });

  it('should print nothing when the installed packages ship no skills', async () => {
    jest
      .mocked(getAgentTelemetryContext)
      .mockReturnValueOnce({ id: 'claude-code', sessionId: undefined });
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);

    await printSkillsForAgentAsync('/root', { packages: ['uuid'] });

    expect(Log.log).not.toHaveBeenCalled();
  });

  it('should warn instead of throwing when the discovery fails', async () => {
    jest
      .mocked(getAgentTelemetryContext)
      .mockReturnValueOnce({ id: 'claude-code', sessionId: undefined });
    jest.mocked(discoverSkillsAsync).mockRejectedValueOnce(new Error('boom'));

    await expect(
      printSkillsForAgentAsync('/root', { packages: ['@acme/tool'] })
    ).resolves.toBeUndefined();
    expect(Log.warn).toHaveBeenCalled();
  });
});
