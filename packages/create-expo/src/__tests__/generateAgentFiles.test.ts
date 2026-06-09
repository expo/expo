import fs from 'fs';
import os from 'os';
import path from 'path';

import { generateAgentFiles } from '../generateAgentFiles';

describe(generateAgentFiles, () => {
  let tmpDir: string;
  let homeDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-test-'));
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-home-'));
    jest.spyOn(os, 'homedir').mockReturnValue(homeDir);
    // Write a minimal package.json so the SDK version can be resolved
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { expo: '~55.0.0' } })
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(homeDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('always generates AGENTS.md', () => {
    generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'AGENTS.md'))).toBe(true);
  });

  it('does not generate Claude files when Claude Code is not installed', () => {
    generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(false);
  });

  it('writes correct content to AGENTS.md with versioned docs URL', () => {
    generateAgentFiles(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8');
    expect(content).toContain('# Expo');
    expect(content).toContain('https://docs.expo.dev/versions/v55.0.0/');
  });

  it('falls back to unversioned docs URL when expo version is missing', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ dependencies: {} }));

    generateAgentFiles(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8');
    expect(content).toContain('https://docs.expo.dev');
    expect(content).not.toContain('/versions/');
  });

  it('writes correct content to CLAUDE.md', () => {
    fs.writeFileSync(path.join(homeDir, '.claude.json'), '{}');

    generateAgentFiles(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toBe('@AGENTS.md\n');
  });

  it('writes correct content to .claude/settings.json', () => {
    fs.writeFileSync(path.join(homeDir, '.claude.json'), '{}');

    generateAgentFiles(tmpDir);

    const content = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8')
    );
    expect(content).toEqual({ enabledPlugins: { 'expo@claude-plugins-official': true } });
  });

  it('skips files that already exist', () => {
    fs.writeFileSync(path.join(homeDir, '.claude.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), 'custom content');
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'custom claude');

    generateAgentFiles(tmpDir);

    expect(fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8')).toBe('custom content');
    expect(fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8')).toBe('custom claude');
    // .claude/settings.json should still be created since it didn't exist
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(true);
  });

  it('creates .claude/ directory for settings when global .claude.json exists', () => {
    fs.writeFileSync(path.join(homeDir, '.claude.json'), '{}');

    expect(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(false);

    generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(true);
    expect(fs.statSync(path.join(tmpDir, '.claude')).isDirectory()).toBe(true);
  });

  it('generates Claude files when global .claude directory exists', () => {
    fs.mkdirSync(path.join(homeDir, '.claude'));

    generateAgentFiles(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(true);
  });
});
