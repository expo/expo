import { vol } from 'memfs';
import prompts from 'prompts';

import {
  AGENTS,
  resolveAgents,
  setupAgentsAsync,
  promptAgentsAsync,
  AgentContext,
} from '../agents';
import { env } from '../utils/env';

jest.mock('fs');
jest.mock('prompts');

const defaultContext: AgentContext = { packageManager: 'npm' };

describe(resolveAgents, () => {
  it('parses a comma-separated string of agent ids', async () => {
    const result = await resolveAgents('claude,cursor', false);
    expect(result).toEqual(['claude', 'cursor']);
  });

  it('filters out invalid agent ids with warning', async () => {
    const result = await resolveAgents('claude,invalid', false);
    expect(result).toEqual(['claude']);
  });

  it('returns empty array for empty string', async () => {
    const result = await resolveAgents('', false);
    expect(result).toEqual([]);
  });

  it('returns empty array when --yes is set and no --agents flag', async () => {
    const result = await resolveAgents(undefined, true);
    expect(result).toEqual([]);
  });

  it('returns empty array in CI mode with no --agents flag', async () => {
    const spy = jest.spyOn(env, 'CI', 'get').mockReturnValue(true);
    const result = await resolveAgents(undefined, false);
    expect(result).toEqual([]);
    spy.mockRestore();
  });

  it('prompts in interactive mode with no flags', async () => {
    const spy = jest.spyOn(env, 'CI', 'get').mockReturnValue(false);
    jest.mocked(prompts).mockResolvedValue({ answer: ['windsurf'] });
    const result = await resolveAgents(undefined, false);
    expect(result).toEqual(['windsurf']);
    spy.mockRestore();
  });
});

describe(promptAgentsAsync, () => {
  it('returns selected agents', async () => {
    jest.mocked(prompts).mockResolvedValue({ answer: ['claude', 'copilot'] });
    const result = await promptAgentsAsync();
    expect(result).toEqual(['claude', 'copilot']);
    expect(prompts).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'multiselect',
        choices: AGENTS.map((a) => ({ title: a.name, value: a.id })),
      })
    );
  });

  it('returns empty array when user presses Escape', async () => {
    jest.mocked(prompts).mockResolvedValue({ answer: undefined });
    const result = await promptAgentsAsync();
    expect(result).toEqual([]);
  });
});

describe(setupAgentsAsync, () => {
  afterEach(() => vol.reset());

  it('deletes config files for unselected agents and keeps AGENTS.md', async () => {
    vol.fromJSON({
      '/project/AGENTS.md': '# {{projectName}}',
      '/project/CLAUDE.md': 'claude config',
      '/project/.claude/settings.json': '{}',
      '/project/.cursor/rules/expo.mdc': 'cursor config',
      '/project/.windsurf/rules/expo.md': 'windsurf config',
      '/project/package.json': '{"name":"test-app","dependencies":{"expo":"~55.0.0"}}',
    });

    await setupAgentsAsync('/project', { agents: 'claude' }, defaultContext);

    // Shared AGENTS.md should remain (at least one agent selected)
    expect(vol.existsSync('/project/AGENTS.md')).toBe(true);

    // Claude files should remain
    expect(vol.existsSync('/project/CLAUDE.md')).toBe(true);
    expect(vol.existsSync('/project/.claude/settings.json')).toBe(true);

    // Other agent files should be deleted
    expect(vol.existsSync('/project/.cursor')).toBe(false);
    expect(vol.existsSync('/project/.windsurf')).toBe(false);
  });

  it('deletes all agent configs including AGENTS.md when --yes with no --agents', async () => {
    vol.fromJSON({
      '/project/AGENTS.md': '# shared',
      '/project/CLAUDE.md': 'claude config',
      '/project/.claude/settings.json': '{}',
      '/project/.cursor/rules/expo.mdc': 'cursor config',
      '/project/.windsurf/rules/expo.md': 'windsurf config',
    });

    await setupAgentsAsync('/project', { yes: true }, defaultContext);

    expect(vol.existsSync('/project/AGENTS.md')).toBe(false);
    expect(vol.existsSync('/project/CLAUDE.md')).toBe(false);
    expect(vol.existsSync('/project/.claude')).toBe(false);
    expect(vol.existsSync('/project/.cursor')).toBe(false);
    expect(vol.existsSync('/project/.windsurf')).toBe(false);
  });

  it('handles missing config files gracefully', async () => {
    vol.fromJSON({
      '/project/package.json': '{}',
    });

    // Should not throw even if no agent config files exist
    await expect(
      setupAgentsAsync('/project', { agents: 'claude' }, defaultContext)
    ).resolves.not.toThrow();
  });

  it('replaces placeholders in AGENTS.md and tool-specific files', async () => {
    vol.fromJSON({
      '/project/AGENTS.md':
        '# {{projectName}}\n\nSDK {{sdkVersion}}. PM: {{packageManager}}.\n\n`{{packageRunCommand}} start`',
      '/project/CLAUDE.md': 'skills only',
      '/project/.claude/settings.json': '{}',
      '/project/package.json': '{"name":"my-app","dependencies":{"expo":"~55.0.0"}}',
    });

    await setupAgentsAsync('/project', { agents: 'claude' }, { packageManager: 'npm' });

    const content = vol.readFileSync('/project/AGENTS.md', 'utf-8') as string;
    expect(content).toContain('# my-app');
    expect(content).toContain('SDK 55');
    expect(content).toContain('PM: npm');
    expect(content).toContain('`npm run start`');
    expect(content).not.toContain('{{');
  });

  it('replaces placeholders with yarn package manager', async () => {
    vol.fromJSON({
      '/project/AGENTS.md':
        '# {{projectName}}\n\nPM: {{packageManager}}.\n\n`{{packageRunCommand}} start`',
      '/project/CLAUDE.md': 'skills',
      '/project/.claude/settings.json': '{}',
      '/project/package.json': '{"name":"yarn-app","dependencies":{"expo":"^54.1.0"}}',
    });

    await setupAgentsAsync('/project', { agents: 'claude' }, { packageManager: 'yarn' });

    const content = vol.readFileSync('/project/AGENTS.md', 'utf-8') as string;
    expect(content).toContain('# yarn-app');
    expect(content).toContain('PM: yarn');
    expect(content).toContain('`yarn start`');
  });

  it('replaces placeholders in nested directory files', async () => {
    vol.fromJSON({
      '/project/AGENTS.md': '# {{projectName}}',
      '/project/.cursor/rules/expo.mdc': 'Use `{{packageManager}} install` for deps',
      '/project/package.json': '{"name":"test","dependencies":{"expo":"~55.0.0"}}',
    });

    await setupAgentsAsync('/project', { agents: 'cursor' }, { packageManager: 'pnpm' });

    const content = vol.readFileSync('/project/.cursor/rules/expo.mdc', 'utf-8') as string;
    expect(content).toContain('Use `pnpm install` for deps');
  });

  it('keeps AGENTS.md and copilot-instructions.md when copilot is the only selected agent', async () => {
    vol.fromJSON({
      '/project/AGENTS.md': '# {{projectName}}\n\nPM: {{packageManager}}.',
      '/project/CLAUDE.md': 'claude',
      '/project/.claude/settings.json': '{}',
      '/project/.cursor/rules/expo.mdc': 'cursor',
      '/project/.windsurf/rules/expo.md': 'windsurf',
      '/project/.github/copilot-instructions.md': 'Read AGENTS.md',
      '/project/package.json': '{"name":"copilot-app","dependencies":{"expo":"~55.0.0"}}',
    });

    await setupAgentsAsync('/project', { agents: 'copilot' }, { packageManager: 'npm' });

    // AGENTS.md should remain and have placeholders replaced
    expect(vol.existsSync('/project/AGENTS.md')).toBe(true);
    const content = vol.readFileSync('/project/AGENTS.md', 'utf-8') as string;
    expect(content).toContain('# copilot-app');
    expect(content).toContain('PM: npm');

    // Copilot instructions should remain
    expect(vol.existsSync('/project/.github/copilot-instructions.md')).toBe(true);

    // All other tool-specific files should be removed
    expect(vol.existsSync('/project/CLAUDE.md')).toBe(false);
    expect(vol.existsSync('/project/.cursor')).toBe(false);
    expect(vol.existsSync('/project/.windsurf')).toBe(false);
  });

  it('removes copilot-instructions.md but keeps .github/ when copilot is not selected', async () => {
    vol.fromJSON({
      '/project/AGENTS.md': '# {{projectName}}',
      '/project/CLAUDE.md': 'claude',
      '/project/.claude/settings.json': '{}',
      '/project/.github/copilot-instructions.md': 'Read AGENTS.md',
      '/project/.github/workflows/ci.yml': 'name: CI',
      '/project/package.json': '{"name":"test-app","dependencies":{"expo":"~55.0.0"}}',
    });

    await setupAgentsAsync('/project', { agents: 'claude' }, { packageManager: 'npm' });

    // Copilot instructions should be removed
    expect(vol.existsSync('/project/.github/copilot-instructions.md')).toBe(false);

    // .github directory and other files in it should remain
    expect(vol.existsSync('/project/.github/workflows/ci.yml')).toBe(true);
  });

  it('keeps AGENTS.md when "other" is the only selected agent', async () => {
    vol.fromJSON({
      '/project/AGENTS.md': '# {{projectName}}\n\nPM: {{packageManager}}.',
      '/project/CLAUDE.md': 'claude',
      '/project/.claude/settings.json': '{}',
      '/project/.cursor/rules/expo.mdc': 'cursor',
      '/project/.windsurf/rules/expo.md': 'windsurf',
      '/project/package.json': '{"name":"other-app","dependencies":{"expo":"~55.0.0"}}',
    });

    await setupAgentsAsync('/project', { agents: 'other' }, { packageManager: 'bun' });

    // AGENTS.md should remain and have placeholders replaced
    expect(vol.existsSync('/project/AGENTS.md')).toBe(true);
    const content = vol.readFileSync('/project/AGENTS.md', 'utf-8') as string;
    expect(content).toContain('# other-app');
    expect(content).toContain('PM: bun');

    // All tool-specific files should be removed
    expect(vol.existsSync('/project/CLAUDE.md')).toBe(false);
    expect(vol.existsSync('/project/.cursor')).toBe(false);
    expect(vol.existsSync('/project/.windsurf')).toBe(false);
  });
});
