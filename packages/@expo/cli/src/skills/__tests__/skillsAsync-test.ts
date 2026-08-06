import { vol } from 'memfs';

import {
  detectInstalledAgents,
  getAllAgents,
  getPersistedAgentIds,
  persistAgentSelectionAsync,
  resolveAgentsAsync,
} from '../agents';
import { discoverSkillsAsync } from '../discovery';
import { cleanSkillLinksAsync, ensureGitIgnoreAsync, syncSkillLinksAsync } from '../linking';
import {
  autoSyncSkillsAsync,
  cleanSkillsAsync,
  listSkillsAsync,
  syncSkillsAsync,
} from '../skillsAsync';
import type { DiscoveredSkill, SkillsAgent } from '../types';

jest.mock('../../log');
jest.mock('../discovery', () => ({ discoverSkillsAsync: jest.fn() }));
jest.mock('../agents', () => ({
  getAllAgents: jest.fn(),
  detectInstalledAgents: jest.fn(),
  getPersistedAgentIds: jest.fn(),
  resolveAgentsAsync: jest.fn(),
  persistAgentSelectionAsync: jest.fn(),
}));
jest.mock('../linking', () => ({
  syncSkillLinksAsync: jest.fn(),
  cleanSkillLinksAsync: jest.fn(),
  ensureGitIgnoreAsync: jest.fn(),
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
  linkName: 'npm-acme-tool-my-skill',
};

describe('syncSkillsAsync', () => {
  afterEach(() => vol.reset());

  it('should link discovered skills into deduped agent directories', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent, cursorAgent, codexAgent],
      fromPrompt: false,
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
      fromPrompt: true,
    });
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await syncSkillsAsync('/root', { agents: [], dryRun: false });

    expect(persistAgentSelectionAsync).toHaveBeenCalledWith('/root', [claudeAgent]);
  });

  it('should not persist agent selection when resolved from flags or config', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent],
      fromPrompt: false,
    });
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await syncSkillsAsync('/root', { agents: [], dryRun: false });

    expect(persistAgentSelectionAsync).not.toHaveBeenCalled();
  });

  it('should update the gitignore only when links were created', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValue([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValue({ agents: [claudeAgent], fromPrompt: false });

    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: ['x'], pruned: [] });
    await syncSkillsAsync('/root', { agents: [], dryRun: false });
    expect(ensureGitIgnoreAsync).toHaveBeenCalledTimes(1);

    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });
    await syncSkillsAsync('/root', { agents: [], dryRun: false });
    expect(ensureGitIgnoreAsync).toHaveBeenCalledTimes(1);
  });

  it('should not persist agent selection during a dry run', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent],
      fromPrompt: true,
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
    jest.mocked(getPersistedAgentIds).mockReturnValueOnce(null);

    await syncSkillsAsync('/root', { agents: [], dryRun: false });

    expect(resolveAgentsAsync).not.toHaveBeenCalled();
    expect(syncSkillLinksAsync).not.toHaveBeenCalled();
  });

  it('should still prune stale links when no skills exist but agents are configured', async () => {
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([]);
    jest.mocked(getPersistedAgentIds).mockReturnValueOnce(['claude-code']);
    jest.mocked(resolveAgentsAsync).mockResolvedValueOnce({
      agents: [claudeAgent],
      fromPrompt: false,
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
    jest.mocked(getPersistedAgentIds).mockReturnValueOnce(null);
    jest.mocked(detectInstalledAgents).mockReturnValueOnce([claudeAgent]);

    await listSkillsAsync('/root');

    expect(resolveAgentsAsync).not.toHaveBeenCalled();
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
  afterEach(() => vol.reset());

  it('should do nothing when autoSync is not enabled', async () => {
    vol.fromJSON({ '/root/package.json': JSON.stringify({ name: 'app' }) });

    await autoSyncSkillsAsync('/root');

    expect(discoverSkillsAsync).not.toHaveBeenCalled();
    expect(syncSkillLinksAsync).not.toHaveBeenCalled();
  });

  it('should sync without prompting when autoSync is enabled', async () => {
    vol.fromJSON({
      '/root/package.json': JSON.stringify({
        name: 'app',
        expo: { skills: { autoSync: true, agents: ['claude-code'] } },
      }),
    });
    jest.mocked(getPersistedAgentIds).mockReturnValueOnce(['claude-code']);
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent, cursorAgent, codexAgent]);
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: ['x'], pruned: [] });

    await autoSyncSkillsAsync('/root');

    expect(resolveAgentsAsync).not.toHaveBeenCalled();
    expect(syncSkillLinksAsync).toHaveBeenCalledWith('/root', [testSkill], ['.claude/skills'], {});
  });

  it('should only link skills from the given packages and skip pruning', async () => {
    vol.fromJSON({
      '/root/package.json': JSON.stringify({
        name: 'app',
        expo: { skills: { autoSync: true, agents: ['claude-code'] } },
      }),
    });
    const otherSkill: DiscoveredSkill = {
      name: 'other-skill',
      path: '/root/node_modules/other/skills/other-skill',
      packageName: 'other',
      linkName: 'npm-other-other-skill',
    };
    jest.mocked(getPersistedAgentIds).mockReturnValueOnce(['claude-code']);
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent]);
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill, otherSkill]);
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await autoSyncSkillsAsync('/root', { packages: ['@acme/tool'] });

    expect(syncSkillLinksAsync).toHaveBeenCalledWith('/root', [testSkill], ['.claude/skills'], {
      prune: false,
    });
  });

  it('should parse versioned package specs when scoping the sync', async () => {
    vol.fromJSON({
      '/root/package.json': JSON.stringify({
        name: 'app',
        expo: { skills: { autoSync: true, agents: ['claude-code'] } },
      }),
    });
    jest.mocked(getPersistedAgentIds).mockReturnValueOnce(['claude-code']);
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent]);
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await autoSyncSkillsAsync('/root', { packages: ['@acme/tool@~1.2.0'] });

    expect(syncSkillLinksAsync).toHaveBeenCalledWith('/root', [testSkill], ['.claude/skills'], {
      prune: false,
    });
  });

  it('should fall back to detected agents when none are persisted', async () => {
    vol.fromJSON({
      '/root/package.json': JSON.stringify({
        name: 'app',
        expo: { skills: { autoSync: true } },
      }),
    });
    jest.mocked(getPersistedAgentIds).mockReturnValueOnce(null);
    jest.mocked(detectInstalledAgents).mockReturnValueOnce([cursorAgent]);
    jest.mocked(discoverSkillsAsync).mockResolvedValueOnce([testSkill]);
    jest.mocked(syncSkillLinksAsync).mockResolvedValueOnce({ created: [], pruned: [] });

    await autoSyncSkillsAsync('/root');

    expect(syncSkillLinksAsync).toHaveBeenCalledWith('/root', [testSkill], ['.agents/skills'], {});
  });

  it('should skip silently when no agents are persisted or detected', async () => {
    vol.fromJSON({
      '/root/package.json': JSON.stringify({
        name: 'app',
        expo: { skills: { autoSync: true } },
      }),
    });
    jest.mocked(getPersistedAgentIds).mockReturnValueOnce(null);
    jest.mocked(detectInstalledAgents).mockReturnValueOnce([]);

    await autoSyncSkillsAsync('/root');

    expect(syncSkillLinksAsync).not.toHaveBeenCalled();
  });

  it('should warn instead of throwing when the sync fails', async () => {
    vol.fromJSON({
      '/root/package.json': JSON.stringify({
        name: 'app',
        expo: { skills: { autoSync: true, agents: ['claude-code'] } },
      }),
    });
    jest.mocked(getPersistedAgentIds).mockReturnValueOnce(['claude-code']);
    jest.mocked(getAllAgents).mockReturnValueOnce([claudeAgent]);
    jest.mocked(discoverSkillsAsync).mockRejectedValueOnce(new Error('boom'));

    await expect(autoSyncSkillsAsync('/root')).resolves.toBeUndefined();
    expect(syncSkillLinksAsync).not.toHaveBeenCalled();
  });
});
