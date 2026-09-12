import { detectAgent } from 'agent-cli-detector';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  CLAUDE_CODE_PLUGIN_HINT,
  detectCodingAgent,
  emitClaudeCodePluginHint,
  getAgentSetup,
  hasExpoPlugin,
  logAgentSetupHint,
} from '../agent';

jest.mock('agent-cli-detector', () => ({
  detectAgent: jest.fn(() => ({ detected: false })),
}));

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

const CLAUDE_CODE = { id: 'claude-code', name: 'Claude Code' };
const CODEX = { id: 'codex', name: 'Codex' };
const CURSOR = { id: 'cursor', name: 'Cursor' };
const GEMINI = { id: 'gemini', name: 'Gemini CLI' };
const COPILOT = { id: 'copilot', name: 'GitHub Copilot CLI' };
const BOLT = { id: 'bolt', name: 'Bolt' };

describe(detectCodingAgent, () => {
  it('returns null when no coding agent is detected', () => {
    asMock(detectAgent).mockReturnValue({ detected: false } as any);

    expect(detectCodingAgent()).toBeNull();
  });

  it('returns the id and name of the detected coding agent', () => {
    asMock(detectAgent).mockReturnValue({
      detected: true,
      agent: { ...CODEX, sessionId: 'thread-1' },
    } as any);

    expect(detectCodingAgent()).toEqual(CODEX);
  });

  it('returns null when detection throws', () => {
    asMock(detectAgent).mockImplementation(() => {
      throw new Error('detection failed');
    });

    expect(detectCodingAgent()).toBeNull();
  });
});

describe(getAgentSetup, () => {
  it('uses the official plugin for Claude Code', () => {
    expect(getAgentSetup(CLAUDE_CODE)).toEqual({
      plugin: true,
      command: 'claude plugin install expo@claude-plugins-official',
      learnMoreUrl: 'https://docs.expo.dev/agents/claude/',
    });
  });

  it('uses the official plugin for Codex', () => {
    expect(getAgentSetup(CODEX)).toEqual({
      plugin: true,
      command: 'codex plugin add expo@openai-curated',
      learnMoreUrl: 'https://docs.expo.dev/agents/codex/',
    });
  });

  it('uses a non-interactive skills CLI command for Cursor', () => {
    expect(getAgentSetup(CURSOR)).toEqual({
      plugin: false,
      command: 'npx skills add expo/skills --skill "*" --agent cursor -y',
      learnMoreUrl: 'https://docs.expo.dev/agents/cursor/',
    });
  });

  it('maps agent ids to the names the skills CLI uses', () => {
    expect(getAgentSetup(GEMINI).command).toBe(
      'npx skills add expo/skills --skill "*" --agent gemini-cli -y'
    );
    expect(getAgentSetup(COPILOT).command).toBe(
      'npx skills add expo/skills --skill "*" --agent github-copilot -y'
    );
    expect(getAgentSetup(GEMINI).learnMoreUrl).toBe('https://docs.expo.dev/skills/');
  });

  it('omits --agent for agents the skills CLI does not know', () => {
    expect(getAgentSetup(BOLT)).toEqual({
      plugin: false,
      command: 'npx skills add expo/skills --skill "*" -y',
      learnMoreUrl: 'https://docs.expo.dev/skills/',
    });
  });

  it('uses the runner of the package manager that created the project', () => {
    expect(getAgentSetup(CURSOR, 'bun').command).toBe(
      'bunx skills add expo/skills --skill "*" --agent cursor -y'
    );
    expect(getAgentSetup(CURSOR, 'pnpm').command).toBe(
      'pnpm dlx skills add expo/skills --skill "*" --agent cursor -y'
    );
    expect(getAgentSetup(CURSOR, 'nub').command).toBe(
      'nubx skills add expo/skills --skill "*" --agent cursor -y'
    );
    // Yarn classic has no `dlx`, and `npx` ships with Node, so npm and yarn share the default.
    expect(getAgentSetup(CURSOR, 'yarn').command).toBe(
      'npx skills add expo/skills --skill "*" --agent cursor -y'
    );
    expect(getAgentSetup(CURSOR, 'npm').command).toBe(
      'npx skills add expo/skills --skill "*" --agent cursor -y'
    );
  });

  it('ignores the package manager for agents with an official plugin', () => {
    expect(getAgentSetup(CLAUDE_CODE, 'bun').command).toBe(
      'claude plugin install expo@claude-plugins-official'
    );
    expect(getAgentSetup(CODEX, 'bun').command).toBe('codex plugin add expo@openai-curated');
  });
});

describe(hasExpoPlugin, () => {
  let homeDir: string;
  const originalEnv = { ...process.env };

  function write(relativePath: string, content: string) {
    const target = path.join(homeDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }

  beforeEach(() => {
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-agent-home-'));
    jest.spyOn(os, 'homedir').mockReturnValue(homeDir);
    delete process.env.CLAUDE_CONFIG_DIR;
    delete process.env.CODEX_HOME;
  });

  afterEach(() => {
    fs.rmSync(homeDir, { recursive: true, force: true });
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('returns false without an agent or without an install', () => {
    expect(hasExpoPlugin(null)).toBe(false);
    expect(hasExpoPlugin(CLAUDE_CODE)).toBe(false);
    expect(hasExpoPlugin(CODEX)).toBe(false);
  });

  it('returns false for agents without an official plugin', () => {
    write('.cursor/skills/expo-overview/SKILL.md', '---\nname: expo-overview\n---');

    expect(hasExpoPlugin(CURSOR)).toBe(false);
  });

  describe('Claude Code', () => {
    it('detects the plugin installed at user scope', () => {
      write(
        '.claude/plugins/installed_plugins.json',
        JSON.stringify({
          version: 2,
          plugins: { 'expo@claude-plugins-official': [{ scope: 'user', version: '1.12.4' }] },
        })
      );

      expect(hasExpoPlugin(CLAUDE_CODE)).toBe(true);
    });

    it('ignores the plugin installed only for another project', () => {
      write(
        '.claude/plugins/installed_plugins.json',
        JSON.stringify({
          version: 2,
          plugins: {
            'expo@claude-plugins-official': [{ scope: 'project', projectPath: '/somewhere/else' }],
          },
        })
      );

      expect(hasExpoPlugin(CLAUDE_CODE)).toBe(false);
    });

    it('ignores a plugin that is only enabled, not installed, in the user settings', () => {
      write(
        '.claude/settings.json',
        JSON.stringify({ enabledPlugins: { 'expo@claude-plugins-official': true } })
      );

      expect(hasExpoPlugin(CLAUDE_CODE)).toBe(false);
    });

    it('honours CLAUDE_CONFIG_DIR', () => {
      process.env.CLAUDE_CONFIG_DIR = path.join(homeDir, 'custom-claude');
      write(
        'custom-claude/plugins/installed_plugins.json',
        JSON.stringify({
          version: 2,
          plugins: { 'expo@claude-plugins-official': [{ scope: 'user' }] },
        })
      );

      expect(hasExpoPlugin(CLAUDE_CODE)).toBe(true);
    });

    it('returns false for malformed plugin metadata', () => {
      write('.claude/plugins/installed_plugins.json', '{ not json');

      expect(hasExpoPlugin(CLAUDE_CODE)).toBe(false);
    });
  });

  describe('Codex', () => {
    it('detects the plugin recorded in config.toml', () => {
      write(
        '.codex/config.toml',
        'model = "gpt-5"\n\n[plugins."expo@openai-curated"]\nenabled = true\n'
      );

      expect(hasExpoPlugin(CODEX)).toBe(true);
    });

    it('ignores other plugins and a bare Expo MCP server entry', () => {
      write(
        '.codex/config.toml',
        '[plugins."github@openai-curated"]\nenabled = true\n\n[mcp_servers.expo]\nurl = "https://mcp.expo.dev/mcp"\n'
      );

      expect(hasExpoPlugin(CODEX)).toBe(false);
    });

    it('honours CODEX_HOME', () => {
      process.env.CODEX_HOME = path.join(homeDir, 'custom-codex');
      write('custom-codex/config.toml', '[plugins."expo@openai-curated"]\nenabled = true\n');

      expect(hasExpoPlugin(CODEX)).toBe(true);
    });
  });
});

describe(emitClaudeCodePluginHint, () => {
  let stderrWrite: jest.SpyInstance;
  const originalIsTTY = Object.getOwnPropertyDescriptor(process.stderr, 'isTTY');

  function setStderrIsTTY(value: boolean | undefined) {
    Object.defineProperty(process.stderr, 'isTTY', { value, configurable: true, writable: true });
  }

  beforeEach(() => {
    stderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    // Claude Code runs commands with piped output, so stderr is not a terminal there.
    setStderrIsTTY(undefined);
  });

  afterEach(() => {
    stderrWrite.mockRestore();
    if (originalIsTTY) {
      Object.defineProperty(process.stderr, 'isTTY', originalIsTTY);
    } else {
      delete (process.stderr as any).isTTY;
    }
  });

  it('writes the plugin hint to stderr on its own line for Claude Code', () => {
    emitClaudeCodePluginHint(CLAUDE_CODE);

    expect(stderrWrite).toHaveBeenCalledTimes(1);
    expect(stderrWrite).toHaveBeenCalledWith(`${CLAUDE_CODE_PLUGIN_HINT}\n`);
    expect(CLAUDE_CODE_PLUGIN_HINT).toBe(
      '<claude-code-hint v="1" type="plugin" value="expo@claude-plugins-official" />'
    );
  });

  it('writes nothing when stderr is a terminal, where a person would see the raw tag', () => {
    setStderrIsTTY(true);

    emitClaudeCodePluginHint(CLAUDE_CODE);

    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it('writes nothing for other agents or without an agent', () => {
    emitClaudeCodePluginHint(CODEX);
    emitClaudeCodePluginHint(null);

    expect(stderrWrite).not.toHaveBeenCalled();
  });
});

describe(logAgentSetupHint, () => {
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  function getOutput(): string {
    return asMock(console.log).mock.calls.flat().join('\n');
  }

  it('prints the plugin command and docs link for a plugin agent', () => {
    logAgentSetupHint(CODEX, { installed: false });

    const output = getOutput();
    expect(output).toContain('Set up Codex for Expo');
    expect(output).toContain('Expo MCP Server');
    expect(output).toContain('codex plugin add expo@openai-curated');
    expect(output).toContain('https://docs.expo.dev/agents/codex/');
  });

  it('prints the skills command for an agent without a plugin', () => {
    logAgentSetupHint(CURSOR, { installed: false });

    const output = getOutput();
    expect(output).toContain('Set up Cursor for Expo');
    expect(output).toContain('npx skills add expo/skills --skill "*" --agent cursor -y');
    expect(output).not.toContain('Expo MCP Server');
  });

  it('uses the runner of the package manager that created the project', () => {
    logAgentSetupHint(CURSOR, { installed: false, packageManager: 'bun' });

    expect(getOutput()).toContain('bunx skills add expo/skills --skill "*" --agent cursor -y');
  });

  it('says the plugin is already installed instead of nudging', () => {
    logAgentSetupHint(CODEX, { installed: true });

    const output = getOutput();
    expect(output).toContain('Codex already has the Expo plugin');
    expect(output).not.toContain('codex plugin add');
  });

  it('prints a generic pointer to the agents docs when no agent is detected', () => {
    logAgentSetupHint(null, { installed: false });

    const output = getOutput();
    expect(output).toContain('https://docs.expo.dev/agents/');
    expect(output).not.toContain('claude plugin install');
    expect(output).not.toContain('codex plugin add');
  });
});
