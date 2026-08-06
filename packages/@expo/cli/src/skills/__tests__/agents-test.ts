import { vol } from 'memfs';

import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import { isInteractive } from '../../utils/interactive';
import { promptAsync } from '../../utils/prompts';
import {
  detectInstalledAgents,
  getAllAgents,
  getPersistedAgentIds,
  persistAgentSelectionAsync,
  resolveAgentsAsync,
} from '../agents';

jest.mock('../../log');
jest.mock('../../utils/interactive', () => ({ isInteractive: jest.fn() }));
jest.mock('../../utils/prompts', () => ({ promptAsync: jest.fn() }));

const projectRoot = '/project';

/** Create marker directories, e.g. `/project/.claude`. */
function createDirectories(...directories: string[]) {
  for (const directory of directories) {
    vol.mkdirSync(directory, { recursive: true });
  }
}

function writePackageJson(json: object) {
  vol.fromJSON({ [`${projectRoot}/package.json`]: JSON.stringify(json, null, 2) });
}

beforeEach(() => {
  vol.reset();
  createDirectories(projectRoot);
  jest.mocked(isInteractive).mockReturnValue(false);
  jest
    .mocked(promptAsync)
    .mockImplementation(async (question: any) => ({ [question.name]: [] }) as any);
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
  it('should detect agents from project marker directories', () => {
    createDirectories(`${projectRoot}/.claude`, `${projectRoot}/.cursor`);

    expect(detectInstalledAgents(projectRoot).map((agent) => agent.id)).toEqual([
      'claude-code',
      'cursor',
    ]);
  });

  it('should detect agents from home marker directories', () => {
    createDirectories('/home/.codex', '/home/.config/opencode', '/home/.codeium', '/home/.gemini');

    expect(detectInstalledAgents(projectRoot).map((agent) => agent.id)).toEqual([
      'codex',
      'opencode',
      'windsurf',
      'gemini-cli',
    ]);
  });

  it('should return an empty array when no markers exist', () => {
    expect(detectInstalledAgents(projectRoot)).toEqual([]);
  });

  it('should ignore markers that are files instead of directories', () => {
    vol.fromJSON({ [`${projectRoot}/.claude`]: 'not a directory' });

    expect(detectInstalledAgents(projectRoot)).toEqual([]);
  });
});

describe('Reading persisted agents', () => {
  it('should return the persisted agent ids', () => {
    writePackageJson({ name: 'app', expo: { skills: { agents: ['cursor', 'claude-code'] } } });

    expect(getPersistedAgentIds(projectRoot)).toEqual(['cursor', 'claude-code']);
  });

  it('should return null when the field is missing', () => {
    writePackageJson({ name: 'app', expo: {} });

    expect(getPersistedAgentIds(projectRoot)).toBeNull();
  });

  it('should return null when package.json does not exist', () => {
    expect(getPersistedAgentIds(projectRoot)).toBeNull();
  });

  it('should warn about unknown ids but keep the known ones', () => {
    writePackageJson({
      name: 'app',
      expo: { skills: { agents: ['claude-code', 'not-an-agent'] } },
    });

    expect(getPersistedAgentIds(projectRoot)).toEqual(['claude-code']);
    expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('not-an-agent'));
  });
});

describe('Resolving agents', () => {
  it('should use the --agent ids over persisted config and detection', async () => {
    createDirectories(`${projectRoot}/.claude`);
    writePackageJson({ name: 'app', expo: { skills: { agents: ['cursor'] } } });

    await expect(resolveAgentsAsync(projectRoot, { agents: ['codex'] })).resolves.toEqual({
      agents: [{ id: 'codex', displayName: 'Codex', skillsDir: '.agents/skills' }],
      fromPrompt: false,
    });
  });

  it('should use the persisted config over the prompt', async () => {
    jest.mocked(isInteractive).mockReturnValue(true);
    writePackageJson({ name: 'app', expo: { skills: { agents: ['cursor'] } } });

    await expect(resolveAgentsAsync(projectRoot, {})).resolves.toEqual({
      agents: [{ id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' }],
      fromPrompt: false,
    });
    expect(promptAsync).not.toHaveBeenCalled();
  });

  it('should prompt with detected agents preselected when interactive', async () => {
    jest.mocked(isInteractive).mockReturnValue(true);
    createDirectories(`${projectRoot}/.claude`);
    jest
      .mocked(promptAsync)
      .mockImplementation(async (question: any) => ({ [question.name]: ['claude-code'] }) as any);

    await expect(resolveAgentsAsync(projectRoot, {})).resolves.toEqual({
      agents: [{ id: 'claude-code', displayName: 'Claude Code', skillsDir: '.claude/skills' }],
      fromPrompt: true,
    });
    expect(promptAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'multiselect',
        choices: expect.arrayContaining([
          expect.objectContaining({ value: 'claude-code', selected: true }),
          expect.objectContaining({ value: 'cursor', selected: false }),
        ]),
      })
    );
  });

  it('should fall back to the detected agents when non-interactive', async () => {
    createDirectories(`${projectRoot}/.cursor`, '/home/.gemini');

    await expect(resolveAgentsAsync(projectRoot, {})).resolves.toEqual({
      agents: [
        { id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' },
        { id: 'gemini-cli', displayName: 'Gemini CLI', skillsDir: '.agents/skills' },
      ],
      fromPrompt: false,
    });
    expect(promptAsync).not.toHaveBeenCalled();
  });

  it('should prompt when the persisted list only contains unknown ids', async () => {
    jest.mocked(isInteractive).mockReturnValue(true);
    writePackageJson({ name: 'app', expo: { skills: { agents: ['not-an-agent'] } } });
    jest
      .mocked(promptAsync)
      .mockImplementation(async (question: any) => ({ [question.name]: ['codex'] }) as any);

    await expect(resolveAgentsAsync(projectRoot, {})).resolves.toEqual({
      agents: [{ id: 'codex', displayName: 'Codex', skillsDir: '.agents/skills' }],
      fromPrompt: true,
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

  it('should throw when nothing is selected in the prompt', async () => {
    jest.mocked(isInteractive).mockReturnValue(true);

    const error = await resolveAgentsAsync(projectRoot, {}).catch((error) => error);

    expect(error).toBeInstanceOf(CommandError);
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toMatch(/--agent/);
  });

  it('should throw when non-interactive and no agent is detected', async () => {
    const error = await resolveAgentsAsync(projectRoot, {}).catch((error) => error);

    expect(error).toBeInstanceOf(CommandError);
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toMatch(/--agent/);
    expect(error.message).toMatch(/claude-code/);
  });
});

describe('Persisting the agent selection', () => {
  it('should write sorted unique ids and preserve the rest of package.json', async () => {
    writePackageJson({
      name: 'app',
      scripts: { start: 'expo start' },
      expo: { install: { exclude: ['react'] } },
    });

    await persistAgentSelectionAsync(projectRoot, [
      { id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' },
      { id: 'claude-code', displayName: 'Claude Code', skillsDir: '.claude/skills' },
      { id: 'cursor', displayName: 'Cursor', skillsDir: '.agents/skills' },
    ]);

    expect(JSON.parse(vol.readFileSync(`${projectRoot}/package.json`, 'utf8') as string)).toEqual({
      name: 'app',
      scripts: { start: 'expo start' },
      expo: {
        install: { exclude: ['react'] },
        skills: { agents: ['claude-code', 'cursor'] },
      },
    });
  });

  it('should replace a previous selection', async () => {
    writePackageJson({ name: 'app', expo: { skills: { agents: ['windsurf'] } } });

    await persistAgentSelectionAsync(projectRoot, [
      { id: 'codex', displayName: 'Codex', skillsDir: '.agents/skills' },
    ]);

    expect(getPersistedAgentIds(projectRoot)).toEqual(['codex']);
  });
});
