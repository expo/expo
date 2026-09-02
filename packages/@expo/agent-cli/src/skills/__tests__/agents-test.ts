import { vol } from 'memfs';

import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import {
  detectInstalledAgentsAsync,
  getAllAgents,
  getPersistedAgentIdsAsync,
  persistAgentSelectionAsync,
  resolveAgentsAsync,
} from '../agents';

jest.mock('../../log');

const projectRoot = '/project';

/** Create marker directories, e.g. `/project/.claude`. */
function createDirectories(...directories: string[]) {
  for (const directory of directories) {
    vol.mkdirSync(directory, { recursive: true });
  }
}

function writeSkillsCache(json: object) {
  vol.fromJSON({ [`${projectRoot}/.expo/agent-skill-links.json`]: JSON.stringify(json, null, 2) });
}

beforeEach(() => {
  vol.reset();
  createDirectories(projectRoot);
});

describe('Listing agents', () => {
  it('should list every supported agent with its skills directory', () => {
    expect(getAllAgents()).toEqual([
      { id: 'claude-code', displayName: 'Claude Code', skillsDir: '.claude/skills' },
      { id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' },
      { id: 'codex', displayName: 'Codex', skillsDir: '.agents/skills' },
      { id: 'opencode', displayName: 'OpenCode', skillsDir: '.agents/skills' },
      { id: 'windsurf', displayName: 'Windsurf', skillsDir: '.agents/skills' },
      { id: 'gemini-cli', displayName: 'Gemini CLI', skillsDir: '.agents/skills' },
    ]);
  });
});

describe('Detecting installed agents', () => {
  it('should detect agents from project marker directories', async () => {
    createDirectories(`${projectRoot}/.claude`, `${projectRoot}/.cursor`);

    const agents = await detectInstalledAgentsAsync(projectRoot);
    expect(agents.map((agent) => agent.id)).toEqual(['claude-code', 'cursor']);
  });

  it('should detect agents from home marker directories', async () => {
    createDirectories('/home/.codex', '/home/.config/opencode', '/home/.codeium', '/home/.gemini');

    const agents = await detectInstalledAgentsAsync(projectRoot);
    expect(agents.map((agent) => agent.id)).toEqual([
      'codex',
      'opencode',
      'windsurf',
      'gemini-cli',
    ]);
  });

  it('should return an empty array when no markers exist', async () => {
    await expect(detectInstalledAgentsAsync(projectRoot)).resolves.toEqual([]);
  });

  it('should ignore markers that are files instead of directories', async () => {
    vol.fromJSON({ [`${projectRoot}/.claude`]: 'not a directory' });

    await expect(detectInstalledAgentsAsync(projectRoot)).resolves.toEqual([]);
  });
});

describe('Reading persisted agents', () => {
  it('should return the persisted agent ids', async () => {
    writeSkillsCache({ agents: ['cursor', 'claude-code'] });

    await expect(getPersistedAgentIdsAsync(projectRoot)).resolves.toEqual([
      'cursor',
      'claude-code',
    ]);
  });

  it('should return null when the field is missing', async () => {
    writeSkillsCache({});

    await expect(getPersistedAgentIdsAsync(projectRoot)).resolves.toBeNull();
  });

  it('should return null when the cache file does not exist', async () => {
    await expect(getPersistedAgentIdsAsync(projectRoot)).resolves.toBeNull();
  });

  it('should not create the cache file when reading', async () => {
    await getPersistedAgentIdsAsync(projectRoot);

    expect(vol.existsSync(`${projectRoot}/.expo/agent-skill-links.json`)).toBe(false);
  });

  it('should warn about unknown ids but keep the known ones', async () => {
    writeSkillsCache({ agents: ['claude-code', 'not-an-agent'] });

    await expect(getPersistedAgentIdsAsync(projectRoot)).resolves.toEqual(['claude-code']);
    expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('not-an-agent'));
  });
});

describe('Resolving agents', () => {
  it('should use the --agent ids over persisted config and detection', async () => {
    createDirectories(`${projectRoot}/.claude`);
    writeSkillsCache({ agents: ['cursor'] });

    await expect(resolveAgentsAsync(projectRoot, { agents: ['codex'] })).resolves.toEqual({
      agents: [{ id: 'codex', displayName: 'Codex', skillsDir: '.agents/skills' }],
      source: 'flags',
    });
  });

  it('should use the persisted config over detection', async () => {
    createDirectories(`${projectRoot}/.claude`);
    writeSkillsCache({ agents: ['cursor'] });

    await expect(resolveAgentsAsync(projectRoot, {})).resolves.toEqual({
      agents: [{ id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' }],
      source: 'cache',
    });
  });

  it('should fall back to the detected agents', async () => {
    createDirectories(`${projectRoot}/.cursor`, '/home/.gemini');

    await expect(resolveAgentsAsync(projectRoot, {})).resolves.toEqual({
      agents: [
        { id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' },
        { id: 'gemini-cli', displayName: 'Gemini CLI', skillsDir: '.agents/skills' },
      ],
      source: 'detected',
    });
  });

  it('should detect when the persisted list only contains unknown ids', async () => {
    writeSkillsCache({ agents: ['not-an-agent'] });
    createDirectories(`${projectRoot}/.cursor`);

    await expect(resolveAgentsAsync(projectRoot, {})).resolves.toEqual({
      agents: [{ id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' }],
      source: 'detected',
    });
  });

  it('should throw when an --agent id is unknown', async () => {
    const error = await resolveAgentsAsync(projectRoot, { agents: ['claude-code', 'nope'] }).catch(
      (error) => error
    );

    expect(error).toBeInstanceOf(CommandError);
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toMatch(/nope/);
    expect(error.message).toMatch(/claude-code, cursor, codex, opencode, windsurf, gemini-cli/);
  });

  // @ref llp/0008-guardrails.rfc.md §Consent is a re-run, never a prompt — the terminal used to
  // get a checklist here, so the same project answered two different ways depending on who ran it.
  it('should answer the same with a terminal watching as without one', async () => {
    createDirectories(`${projectRoot}/.claude`);
    const resolved = await resolveAgentsAsync(projectRoot, {});

    process.stdout.isTTY = true;
    try {
      await expect(resolveAgentsAsync(projectRoot, {})).resolves.toEqual(resolved);
    } finally {
      process.stdout.isTTY = false;
    }
  });

  it('should throw when no agent is detected', async () => {
    const error = await resolveAgentsAsync(projectRoot, {}).catch((error) => error);

    expect(error).toBeInstanceOf(CommandError);
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toMatch(/--agent/);
    expect(error.message).toMatch(/claude-code/);
  });
});

describe('Persisting the agent selection', () => {
  it('should write sorted unique ids to the .expo cache', async () => {
    await persistAgentSelectionAsync(projectRoot, [
      { id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' },
      { id: 'claude-code', displayName: 'Claude Code', skillsDir: '.claude/skills' },
      { id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' },
    ]);

    expect(
      JSON.parse(vol.readFileSync(`${projectRoot}/.expo/agent-skill-links.json`, 'utf8') as string)
    ).toEqual({ agents: ['claude-code', 'cursor'] });
  });

  it('should not touch package.json', async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{"name":"app"}' });

    await persistAgentSelectionAsync(projectRoot, [
      { id: 'codex', displayName: 'Codex', skillsDir: '.agents/skills' },
    ]);

    expect(vol.readFileSync(`${projectRoot}/package.json`, 'utf8')).toBe('{"name":"app"}');
  });

  it('should replace a previous selection', async () => {
    writeSkillsCache({ agents: ['windsurf'] });

    await persistAgentSelectionAsync(projectRoot, [
      { id: 'codex', displayName: 'Codex', skillsDir: '.agents/skills' },
    ]);

    await expect(getPersistedAgentIdsAsync(projectRoot)).resolves.toEqual(['codex']);
  });
});
