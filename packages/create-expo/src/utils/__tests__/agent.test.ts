import { detectAgent } from 'agent-cli-detector';

import {
  CLAUDE_CODE_PLUGIN_HINT,
  detectCodingAgent,
  emitClaudeCodePluginHint,
  getAgentSetupInstructions,
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

describe(detectCodingAgent, () => {
  afterEach(() => {
    asMock(detectAgent).mockReset();
  });

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

describe(getAgentSetupInstructions, () => {
  it('returns the official plugin command for Claude Code', () => {
    expect(getAgentSetupInstructions(CLAUDE_CODE)).toEqual({
      description: expect.stringContaining('Expo MCP Server'),
      command: 'claude plugin install expo@claude-plugins-official',
      learnMoreUrl: 'https://docs.expo.dev/agents/claude/',
    });
  });

  it('returns the official plugin command for Codex', () => {
    expect(getAgentSetupInstructions(CODEX)).toEqual({
      description: expect.stringContaining('Expo MCP Server'),
      command: 'codex plugin add expo@openai-curated',
      learnMoreUrl: 'https://docs.expo.dev/agents/codex/',
    });
  });

  it('returns the skills CLI command for Cursor', () => {
    expect(getAgentSetupInstructions(CURSOR)).toEqual({
      description: expect.not.stringContaining('Expo MCP Server'),
      command: 'npx skills add expo/skills',
      learnMoreUrl: 'https://docs.expo.dev/agents/cursor/',
    });
  });

  it('returns the skills CLI command for agents without an official plugin', () => {
    expect(getAgentSetupInstructions(GEMINI)).toEqual({
      description: expect.not.stringContaining('Expo MCP Server'),
      command: 'npx skills add expo/skills',
      learnMoreUrl: 'https://docs.expo.dev/skills/',
    });
  });
});

describe(emitClaudeCodePluginHint, () => {
  let stderrWrite: jest.SpyInstance;

  beforeEach(() => {
    stderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stderrWrite.mockRestore();
  });

  it('writes the plugin hint to stderr on its own line for Claude Code', () => {
    emitClaudeCodePluginHint(CLAUDE_CODE);

    expect(stderrWrite).toHaveBeenCalledTimes(1);
    expect(stderrWrite).toHaveBeenCalledWith(`${CLAUDE_CODE_PLUGIN_HINT}\n`);
    expect(CLAUDE_CODE_PLUGIN_HINT).toBe(
      '<claude-code-hint v="1" type="plugin" value="expo@claude-plugins-official" />'
    );
  });

  it('writes nothing for other agents', () => {
    emitClaudeCodePluginHint(CODEX);

    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it('writes nothing when no agent is detected', () => {
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

  it('prints the install command and docs link for the detected agent', () => {
    logAgentSetupHint(CODEX);

    const output = getOutput();
    expect(output).toContain('Codex');
    expect(output).toContain('codex plugin add expo@openai-curated');
    expect(output).toContain('https://docs.expo.dev/agents/codex/');
  });

  it('prints the Claude Code plugin command when running inside Claude Code', () => {
    logAgentSetupHint(CLAUDE_CODE);

    const output = getOutput();
    expect(output).toContain('Claude Code');
    expect(output).toContain('claude plugin install expo@claude-plugins-official');
  });

  it('prints a generic pointer to the agents docs when no agent is detected', () => {
    logAgentSetupHint(null);

    const output = getOutput();
    expect(output).toContain('https://docs.expo.dev/agents/');
    expect(output).not.toContain('claude plugin install');
    expect(output).not.toContain('codex plugin add');
  });
});
