import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import { Log } from '../../log';
import { cleanSkillLinksAsync, syncSkillLinksAsync, updateGitIgnoreAsync } from '../linking';
import type { DiscoveredSkill } from '../types';

jest.mock('../../log');

const projectRoot = '/project';

const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

const uiSkill: DiscoveredSkill = {
  name: 'expo-ui',
  path: '/project/node_modules/@expo/ui/skills/expo-ui',
  packageName: '@expo/ui',
  linkName: 'expo-ui',
};

const routerSkill: DiscoveredSkill = {
  name: 'routing',
  path: '/project/node_modules/expo-router/skills/routing',
  packageName: 'expo-router',
  linkName: 'routing',
};

let symlinkSpy: jest.SpyInstance;

beforeEach(() => {
  vol.reset();
  vol.fromJSON(
    {
      'node_modules/@expo/ui/skills/expo-ui/SKILL.md': '# expo-ui',
      'node_modules/expo-router/skills/routing/SKILL.md': '# routing',
    },
    projectRoot
  );

  // memfs@3 resolves a relative symlink target against `process.cwd()` instead of the link's own
  // directory, which would leave every link broken. Store an absolute target so the volume behaves
  // like a real file system, and assert the relative target through the spy instead.
  const symlinkAsync = fs.promises.symlink;
  symlinkSpy = jest
    .spyOn(fs.promises, 'symlink')
    .mockImplementation((target, linkPath, type) =>
      symlinkAsync(path.resolve(path.dirname(linkPath as string), target as string), linkPath, type)
    );
});

afterEach(() => {
  jest.restoreAllMocks();
  mockPlatform(realPlatform);
});

describe(syncSkillLinksAsync, () => {
  it('should create a link named after the skill in every agent directory', async () => {
    const results = await syncSkillLinksAsync(
      projectRoot,
      [uiSkill, routerSkill],
      ['.claude/skills', '.agents/skills']
    );

    expect(results).toEqual({
      created: [
        '.claude/skills/expo-ui',
        '.claude/skills/routing',
        '.agents/skills/expo-ui',
        '.agents/skills/routing',
      ],
      pruned: [],
    });

    for (const link of results.created) {
      expect(vol.lstatSync(`${projectRoot}/${link}`).isSymbolicLink()).toBe(true);
    }
  });

  it('should point links at a relative target', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(symlinkSpy.mock.calls[0][0]).toBe('../../node_modules/@expo/ui/skills/expo-ui');
    expect(symlinkSpy.mock.calls[0][1]).toBe('/project/.claude/skills/expo-ui');
    expect(vol.readFileSync('/project/.claude/skills/expo-ui/SKILL.md', 'utf8')).toBe('# expo-ui');
  });

  it('should create a directory link on posix and a junction on windows', async () => {
    mockPlatform('darwin');
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);
    expect(symlinkSpy.mock.calls[0][2]).toBe('dir');

    vol.reset();
    mockPlatform('win32');
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);
    expect(symlinkSpy.mock.calls[1][2]).toBe('junction');
  });

  it('should link only the first package when two skills share a name', async () => {
    vol.fromJSON({ 'node_modules/other/skills/expo-ui/SKILL.md': '# other' }, projectRoot);
    const duplicate: DiscoveredSkill = {
      name: 'expo-ui',
      path: '/project/node_modules/other/skills/expo-ui',
      packageName: 'other',
      linkName: 'expo-ui',
    };

    const results = await syncSkillLinksAsync(
      projectRoot,
      [uiSkill, duplicate],
      ['.claude/skills']
    );

    expect(results.created).toEqual(['.claude/skills/expo-ui']);
    expect(vol.readFileSync('/project/.claude/skills/expo-ui/SKILL.md', 'utf8')).toBe('# expo-ui');
    expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('other'));
  });

  it('should create nothing on a second run', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill, routerSkill], ['.claude/skills']);
    const results = await syncSkillLinksAsync(
      projectRoot,
      [uiSkill, routerSkill],
      ['.claude/skills']
    );

    expect(results).toEqual({ created: [], pruned: [] });
  });

  it('should replace a managed link that points at the wrong target', async () => {
    vol.mkdirSync('/project/.claude/skills', { recursive: true });
    vol.symlinkSync(routerSkill.path, '/project/.claude/skills/expo-ui');

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results).toEqual({ created: ['.claude/skills/expo-ui'], pruned: [] });
    expect(vol.readFileSync('/project/.claude/skills/expo-ui/SKILL.md', 'utf8')).toBe('# expo-ui');
  });

  it('should prune a managed link that is no longer wanted', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill, routerSkill], ['.claude/skills']);

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results).toEqual({
      created: [],
      pruned: ['.claude/skills/routing'],
    });
    expect(vol.existsSync('/project/.claude/skills/routing')).toBe(false);
    expect(vol.existsSync('/project/.claude/skills/expo-ui')).toBe(true);
  });

  it('should keep stale managed links when prune is disabled', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill, routerSkill], ['.claude/skills']);

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills'], {
      prune: false,
    });

    expect(results).toEqual({ created: [], pruned: [] });
    expect(vol.existsSync('/project/.claude/skills/routing')).toBe(true);
  });

  it('should prune a managed link whose target no longer exists', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill, routerSkill], ['.claude/skills']);
    vol.rmSync('/project/node_modules/expo-router', { recursive: true });

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results.pruned).toEqual(['.claude/skills/routing']);
    expect(
      vol.lstatSync('/project/.claude/skills/routing', {
        throwIfNoEntry: false,
      })
    ).toBeUndefined();
  });

  it('should keep entries that are not links into node_modules', async () => {
    vol.fromJSON(
      {
        '.claude/skills/my-own-skill/SKILL.md': '# mine',
        '.claude/skills/notes.md': 'notes',
        'shared/skills/local/SKILL.md': '# local',
      },
      projectRoot
    );
    vol.mkdirSync('/project/.claude/skills', { recursive: true });
    vol.symlinkSync('/project/shared/skills/local', '/project/.claude/skills/local');

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results.pruned).toEqual([]);
    expect(vol.existsSync('/project/.claude/skills/my-own-skill/SKILL.md')).toBe(true);
    expect(vol.existsSync('/project/.claude/skills/notes.md')).toBe(true);
    expect(vol.lstatSync('/project/.claude/skills/local').isSymbolicLink()).toBe(true);
  });

  it('should keep a wanted name that is a real directory instead of a link', async () => {
    vol.fromJSON({ '.claude/skills/expo-ui/SKILL.md': '# not ours' }, projectRoot);

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results).toEqual({ created: [], pruned: [] });
    expect(vol.readFileSync('/project/.claude/skills/expo-ui/SKILL.md', 'utf8')).toBe('# not ours');
    expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('.claude/skills/expo-ui'));
  });

  it('should keep a wanted name that is a user symlink outside node_modules', async () => {
    vol.fromJSON({ 'shared/skills/expo-ui/SKILL.md': '# not ours' }, projectRoot);
    vol.mkdirSync('/project/.claude/skills', { recursive: true });
    vol.symlinkSync('/project/shared/skills/expo-ui', '/project/.claude/skills/expo-ui');

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results).toEqual({ created: [], pruned: [] });
    expect(vol.readFileSync('/project/.claude/skills/expo-ui/SKILL.md', 'utf8')).toBe('# not ours');
    expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('.claude/skills/expo-ui'));
  });

  it('should not create an agent directory when there are no skills', async () => {
    const results = await syncSkillLinksAsync(projectRoot, [], ['.claude/skills']);

    expect(results).toEqual({ created: [], pruned: [] });
    expect(vol.existsSync('/project/.claude')).toBe(false);
  });

  it('should report planned changes without writing when dryRun is true', async () => {
    await syncSkillLinksAsync(projectRoot, [routerSkill], ['.claude/skills']);
    const before = vol.toJSON();

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills'], {
      dryRun: true,
    });

    expect(results).toEqual({
      created: ['.claude/skills/expo-ui'],
      pruned: ['.claude/skills/routing'],
    });
    expect(vol.toJSON()).toEqual(before);
  });
});

describe(cleanSkillLinksAsync, () => {
  it('should remove every managed link in the agent directories', async () => {
    await syncSkillLinksAsync(
      projectRoot,
      [uiSkill, routerSkill],
      ['.claude/skills', '.agents/skills']
    );

    const results = await cleanSkillLinksAsync(projectRoot, ['.claude/skills', '.agents/skills']);

    expect(results.pruned.sort()).toEqual([
      '.agents/skills/expo-ui',
      '.agents/skills/routing',
      '.claude/skills/expo-ui',
      '.claude/skills/routing',
    ]);
    expect(vol.readdirSync('/project/.claude/skills')).toEqual([]);
    expect(vol.readdirSync('/project/.agents/skills')).toEqual([]);
  });

  it('should keep entries that are not managed links', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);
    vol.fromJSON(
      {
        '.claude/skills/my-own-skill/SKILL.md': '# mine',
        'shared/skills/local/SKILL.md': '# local',
      },
      projectRoot
    );
    vol.symlinkSync('/project/shared/skills/local', '/project/.claude/skills/local');

    const results = await cleanSkillLinksAsync(projectRoot, ['.claude/skills']);

    expect(results.pruned).toEqual(['.claude/skills/expo-ui']);
    expect(vol.existsSync('/project/.claude/skills/my-own-skill/SKILL.md')).toBe(true);
    expect(vol.lstatSync('/project/.claude/skills/local').isSymbolicLink()).toBe(true);
  });

  it('should return no removals when the agent directory does not exist', async () => {
    const results = await cleanSkillLinksAsync(projectRoot, ['.claude/skills']);

    expect(results).toEqual({ pruned: [] });
  });

  it('should report removals without writing when dryRun is true', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);
    const before = vol.toJSON();

    const results = await cleanSkillLinksAsync(projectRoot, ['.claude/skills'], { dryRun: true });

    expect(results.pruned).toEqual(['.claude/skills/expo-ui']);
    expect(vol.toJSON()).toEqual(before);
  });
});

describe(updateGitIgnoreAsync, () => {
  const agentDirs = ['.claude/skills', '.agents/skills'];

  it('should append a generated block listing the managed links', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules/\n' }, projectRoot);
    await syncSkillLinksAsync(projectRoot, [uiSkill, routerSkill], ['.claude/skills']);

    await expect(updateGitIgnoreAsync(projectRoot, agentDirs)).resolves.toBe(true);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe(
      [
        'node_modules/',
        '# @generated expo skills start',
        '.claude/skills/expo-ui',
        '.claude/skills/routing',
        '# @generated expo skills end',
        '',
      ].join('\n')
    );
  });

  it('should create the file when there is no .gitignore', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    await expect(updateGitIgnoreAsync(projectRoot, agentDirs)).resolves.toBe(true);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe(
      [
        '# @generated expo skills start',
        '.claude/skills/expo-ui',
        '# @generated expo skills end',
        '',
      ].join('\n')
    );
  });

  it('should rewrite an outdated block in place', async () => {
    vol.fromJSON(
      {
        '.gitignore': [
          'node_modules/',
          '# @generated expo skills start',
          '.claude/skills/removed-skill',
          '# @generated expo skills end',
          'build/',
          '',
        ].join('\n'),
      },
      projectRoot
    );
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    await expect(updateGitIgnoreAsync(projectRoot, agentDirs)).resolves.toBe(true);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe(
      [
        'node_modules/',
        '# @generated expo skills start',
        '.claude/skills/expo-ui',
        '# @generated expo skills end',
        'build/',
        '',
      ].join('\n')
    );
  });

  it('should remove the block when no managed links remain', async () => {
    vol.fromJSON(
      {
        '.gitignore': [
          'node_modules/',
          '# @generated expo skills start',
          '.claude/skills/expo-ui',
          '# @generated expo skills end',
          '',
        ].join('\n'),
      },
      projectRoot
    );

    await expect(updateGitIgnoreAsync(projectRoot, agentDirs)).resolves.toBe(true);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe('node_modules/\n');
  });

  it('should not create a .gitignore when there are no managed links', async () => {
    await expect(updateGitIgnoreAsync(projectRoot, agentDirs)).resolves.toBe(false);

    expect(vol.existsSync('/project/.gitignore')).toBe(false);
  });

  it('should return false when the block is already up to date', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);
    await updateGitIgnoreAsync(projectRoot, agentDirs);
    const before = vol.readFileSync('/project/.gitignore', 'utf8');

    await expect(updateGitIgnoreAsync(projectRoot, agentDirs)).resolves.toBe(false);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe(before);
  });

  it('should report the change without writing when dryRun is true', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules/\n' }, projectRoot);
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    await expect(updateGitIgnoreAsync(projectRoot, agentDirs, { dryRun: true })).resolves.toBe(
      true
    );

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe('node_modules/\n');
  });
});
