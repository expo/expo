import { detectAgent } from 'agent-cli-detector';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { generateAgentFiles } from '../generateAgentFiles';

jest.mock('agent-cli-detector', () => ({
  detectAgent: jest.fn(() => ({ detected: false })),
}));

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

function readAgentTemplate(fileName: 'AGENTS.md' | 'CLAUDE.md'): string {
  return fs.readFileSync(
    path.join(__dirname, '..', '..', 'template', 'agent-files', fileName),
    'utf-8'
  );
}

function mockRunningInside(agent: { id: string; name: string } | null) {
  asMock(detectAgent).mockReturnValue(
    (agent ? { detected: true, agent } : { detected: false }) as any
  );
}

describe(generateAgentFiles, () => {
  let tmpDir: string;
  let homeDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-test-'));
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-home-'));
    jest.spyOn(os, 'homedir').mockReturnValue(homeDir);
    mockRunningInside(null);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(homeDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('always generates AGENTS.md', async () => {
    await generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'AGENTS.md'))).toBe(true);
  });

  it('does not generate Claude files when Claude Code is not installed', async () => {
    await generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(false);
  });

  it('copies AGENTS.md from the bundled agent templates', async () => {
    await generateAgentFiles(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8');
    expect(content).toBe(readAgentTemplate('AGENTS.md'));
  });

  it('copies CLAUDE.md from the bundled agent templates', async () => {
    fs.writeFileSync(path.join(homeDir, '.claude.json'), '{}');

    await generateAgentFiles(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toBe(readAgentTemplate('CLAUDE.md'));
  });

  it('writes correct content to .claude/settings.json', async () => {
    fs.writeFileSync(path.join(homeDir, '.claude.json'), '{}');

    await generateAgentFiles(tmpDir);

    const content = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8')
    );
    expect(content).toEqual({ enabledPlugins: { 'expo@claude-plugins-official': true } });
  });

  it('skips files that already exist', async () => {
    fs.writeFileSync(path.join(homeDir, '.claude.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), 'custom content');
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'custom claude');

    await generateAgentFiles(tmpDir);

    expect(fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8')).toBe('custom content');
    expect(fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8')).toBe('custom claude');
    // .claude/settings.json should still be created since it didn't exist
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(true);
  });

  it('creates .claude/ directory for settings when global .claude.json exists', async () => {
    fs.writeFileSync(path.join(homeDir, '.claude.json'), '{}');

    expect(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(false);

    await generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(true);
    expect(fs.statSync(path.join(tmpDir, '.claude')).isDirectory()).toBe(true);
  });

  it('generates Claude files when global .claude directory exists', async () => {
    fs.mkdirSync(path.join(homeDir, '.claude'));

    await generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(true);
  });

  it('generates Claude files when running inside Claude Code without a local install', async () => {
    mockRunningInside({ id: 'claude-code', name: 'Claude Code' });

    await generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(true);
  });

  it('does not generate Claude files when running inside another agent', async () => {
    mockRunningInside({ id: 'codex', name: 'Codex' });

    await generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(false);
  });
});
