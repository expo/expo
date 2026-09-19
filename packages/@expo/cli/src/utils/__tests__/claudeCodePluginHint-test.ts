import { detectAgent } from 'agent-cli-detector';

import { CLAUDE_CODE_PLUGIN_HINT, emitClaudeCodePluginHint } from '../claudeCodePluginHint';

jest.mock('agent-cli-detector', () => ({
  detectAgent: jest.fn(() => ({ detected: false })),
}));

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

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

  it('writes the hint on its own stderr line when running inside Claude Code', () => {
    asMock(detectAgent).mockReturnValue({
      detected: true,
      agent: { id: 'claude-code', name: 'Claude Code' },
    } as any);

    emitClaudeCodePluginHint();

    expect(stderrWrite).toHaveBeenCalledTimes(1);
    expect(stderrWrite).toHaveBeenCalledWith(`${CLAUDE_CODE_PLUGIN_HINT}\n`);
    expect(CLAUDE_CODE_PLUGIN_HINT).toBe(
      '<claude-code-hint v="1" type="plugin" value="expo@claude-plugins-official" />'
    );
  });

  it('writes nothing when stderr is a terminal, where a person would see the raw tag', () => {
    asMock(detectAgent).mockReturnValue({
      detected: true,
      agent: { id: 'claude-code', name: 'Claude Code' },
    } as any);
    setStderrIsTTY(true);

    emitClaudeCodePluginHint();

    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it('writes nothing for other agents', () => {
    asMock(detectAgent).mockReturnValue({
      detected: true,
      agent: { id: 'codex', name: 'Codex' },
    } as any);

    emitClaudeCodePluginHint();

    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it('writes nothing outside of an agent', () => {
    asMock(detectAgent).mockReturnValue({ detected: false } as any);

    emitClaudeCodePluginHint();

    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it('never throws when detection fails', () => {
    asMock(detectAgent).mockImplementation(() => {
      throw new Error('detection failed');
    });

    expect(() => emitClaudeCodePluginHint()).not.toThrow();
    expect(stderrWrite).not.toHaveBeenCalled();
  });
});
