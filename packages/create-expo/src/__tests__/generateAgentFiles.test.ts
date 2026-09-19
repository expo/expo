import fs from 'fs';
import os from 'os';
import path from 'path';

import { generateAgentFiles } from '../generateAgentFiles';

function readAgentTemplate(fileName: 'AGENTS.md'): string {
  return fs.readFileSync(
    path.join(__dirname, '..', '..', 'template', 'agent-files', fileName),
    'utf-8'
  );
}

describe(generateAgentFiles, () => {
  let tmpDir: string;
  let homeDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-test-'));
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-home-'));
    jest.spyOn(os, 'homedir').mockReturnValue(homeDir);
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

  it('does not generate Claude settings when Claude Code is not installed', async () => {
    await generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(false);
  });

  it('copies AGENTS.md from the bundled agent templates', async () => {
    await generateAgentFiles(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8');
    expect(content).toBe(readAgentTemplate('AGENTS.md'));
  });

  it('does not generate CLAUDE.md when Claude Code is installed', async () => {
    fs.writeFileSync(path.join(homeDir, '.claude.json'), '{}');

    await generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(false);
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

    await generateAgentFiles(tmpDir);

    expect(fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8')).toBe('custom content');
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

  it('generates Claude settings when global .claude directory exists', async () => {
    fs.mkdirSync(path.join(homeDir, '.claude'));

    await generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(true);
  });
});
