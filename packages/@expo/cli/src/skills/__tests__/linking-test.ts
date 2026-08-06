import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import { Log } from '../../log';
import {
  cleanSkillLinksAsync,
  ensureGitIgnoreAsync,
  MANAGED_LINK_PREFIX,
  syncSkillLinksAsync,
} from '../linking';
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
  linkName: 'npm-expo-ui-expo-ui',
};

const routerSkill: DiscoveredSkill = {
  name: 'routing',
  path: '/project/node_modules/expo-router/skills/routing',
  packageName: 'expo-router',
  linkName: 'npm-expo-router-routing',
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
  it('should create a link for every skill in every agent directory', async () => {
    const results = await syncSkillLinksAsync(
      projectRoot,
      [uiSkill, routerSkill],
      ['.claude/skills', '.agents/skills']
    );

    expect(results).toEqual({
      created: [
        '.claude/skills/npm-expo-ui-expo-ui',
        '.claude/skills/npm-expo-router-routing',
        '.agents/skills/npm-expo-ui-expo-ui',
        '.agents/skills/npm-expo-router-routing',
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
    expect(symlinkSpy.mock.calls[0][1]).toBe('/project/.claude/skills/npm-expo-ui-expo-ui');
    expect(vol.readFileSync('/project/.claude/skills/npm-expo-ui-expo-ui/SKILL.md', 'utf8')).toBe(
      '# expo-ui'
    );
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

  it('should prefix every managed link name', async () => {
    const { created } = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(created).toEqual([`.claude/skills/${MANAGED_LINK_PREFIX}expo-ui-expo-ui`]);
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
    vol.symlinkSync(routerSkill.path, '/project/.claude/skills/npm-expo-ui-expo-ui');

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results).toEqual({ created: ['.claude/skills/npm-expo-ui-expo-ui'], pruned: [] });
    expect(vol.readFileSync('/project/.claude/skills/npm-expo-ui-expo-ui/SKILL.md', 'utf8')).toBe(
      '# expo-ui'
    );
  });

  it('should prune a managed link that is no longer wanted', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill, routerSkill], ['.claude/skills']);

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results).toEqual({
      created: [],
      pruned: ['.claude/skills/npm-expo-router-routing'],
    });
    expect(vol.existsSync('/project/.claude/skills/npm-expo-router-routing')).toBe(false);
    expect(vol.existsSync('/project/.claude/skills/npm-expo-ui-expo-ui')).toBe(true);
  });

  it('should keep stale managed links when prune is disabled', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill, routerSkill], ['.claude/skills']);

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills'], {
      prune: false,
    });

    expect(results).toEqual({ created: [], pruned: [] });
    expect(vol.existsSync('/project/.claude/skills/npm-expo-router-routing')).toBe(true);
  });

  it('should prune a managed link whose target no longer exists', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill, routerSkill], ['.claude/skills']);
    vol.rmSync('/project/node_modules/expo-router', { recursive: true });

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results.pruned).toEqual(['.claude/skills/npm-expo-router-routing']);
    expect(
      vol.lstatSync('/project/.claude/skills/npm-expo-router-routing', {
        throwIfNoEntry: false,
      })
    ).toBeUndefined();
  });

  it('should keep entries without the managed prefix', async () => {
    vol.fromJSON(
      {
        '.claude/skills/my-own-skill/SKILL.md': '# mine',
        '.claude/skills/notes.md': 'notes',
      },
      projectRoot
    );

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results.pruned).toEqual([]);
    expect(vol.existsSync('/project/.claude/skills/my-own-skill/SKILL.md')).toBe(true);
    expect(vol.existsSync('/project/.claude/skills/notes.md')).toBe(true);
  });

  it('should keep a managed name that is a real directory instead of a link', async () => {
    vol.fromJSON({ '.claude/skills/npm-expo-ui-expo-ui/SKILL.md': '# not ours' }, projectRoot);

    const results = await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);

    expect(results).toEqual({ created: [], pruned: [] });
    expect(vol.readFileSync('/project/.claude/skills/npm-expo-ui-expo-ui/SKILL.md', 'utf8')).toBe(
      '# not ours'
    );
    expect(Log.warn).toHaveBeenCalledWith(
      expect.stringContaining('.claude/skills/npm-expo-ui-expo-ui')
    );
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
      created: ['.claude/skills/npm-expo-ui-expo-ui'],
      pruned: ['.claude/skills/npm-expo-router-routing'],
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
      '.agents/skills/npm-expo-router-routing',
      '.agents/skills/npm-expo-ui-expo-ui',
      '.claude/skills/npm-expo-router-routing',
      '.claude/skills/npm-expo-ui-expo-ui',
    ]);
    expect(vol.readdirSync('/project/.claude/skills')).toEqual([]);
    expect(vol.readdirSync('/project/.agents/skills')).toEqual([]);
  });

  it('should keep entries that are not managed links', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);
    vol.fromJSON(
      {
        '.claude/skills/my-own-skill/SKILL.md': '# mine',
        '.claude/skills/npm-not-a-link/SKILL.md': '# also mine',
      },
      projectRoot
    );

    const results = await cleanSkillLinksAsync(projectRoot, ['.claude/skills']);

    expect(results.pruned).toEqual(['.claude/skills/npm-expo-ui-expo-ui']);
    expect(vol.existsSync('/project/.claude/skills/my-own-skill/SKILL.md')).toBe(true);
    expect(vol.existsSync('/project/.claude/skills/npm-not-a-link/SKILL.md')).toBe(true);
  });

  it('should return no removals when the agent directory does not exist', async () => {
    const results = await cleanSkillLinksAsync(projectRoot, ['.claude/skills']);

    expect(results).toEqual({ pruned: [] });
  });

  it('should report removals without writing when dryRun is true', async () => {
    await syncSkillLinksAsync(projectRoot, [uiSkill], ['.claude/skills']);
    const before = vol.toJSON();

    const results = await cleanSkillLinksAsync(projectRoot, ['.claude/skills'], { dryRun: true });

    expect(results.pruned).toEqual(['.claude/skills/npm-expo-ui-expo-ui']);
    expect(vol.toJSON()).toEqual(before);
  });
});

describe(ensureGitIgnoreAsync, () => {
  it('should append the pattern when it is missing', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules/\n' }, projectRoot);

    await expect(ensureGitIgnoreAsync(projectRoot)).resolves.toBe(true);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe(
      'node_modules/\n**/skills/npm-*\n'
    );
  });

  it('should create the file when there is no .gitignore', async () => {
    await expect(ensureGitIgnoreAsync(projectRoot)).resolves.toBe(true);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe('**/skills/npm-*\n');
  });

  it('should add a line break before the pattern when the file has no trailing newline', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules/' }, projectRoot);

    await expect(ensureGitIgnoreAsync(projectRoot)).resolves.toBe(true);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe(
      'node_modules/\n**/skills/npm-*\n'
    );
  });

  it('should return false when the pattern already exists', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules/\n  **/skills/npm-*  \nbuild/\n' }, projectRoot);

    await expect(ensureGitIgnoreAsync(projectRoot)).resolves.toBe(false);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe(
      'node_modules/\n  **/skills/npm-*  \nbuild/\n'
    );
  });

  it('should report the change without writing when dryRun is true', async () => {
    vol.fromJSON({ '.gitignore': 'node_modules/\n' }, projectRoot);

    await expect(ensureGitIgnoreAsync(projectRoot, { dryRun: true })).resolves.toBe(true);

    expect(vol.readFileSync('/project/.gitignore', 'utf8')).toBe('node_modules/\n');
  });
});
