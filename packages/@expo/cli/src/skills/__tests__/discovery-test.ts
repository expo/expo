import { vol } from 'memfs';

import { discoverSkillsAsync, parseSkillFrontmatter } from '../discovery';

jest.mock('expo/internal/unstable-autolinking-exports', () => ({
  makeCachedDependenciesLinker: jest.fn(),
}));

const autolinking = require('expo/internal/unstable-autolinking-exports') as jest.Mocked<
  typeof import('expo-modules-autolinking/exports')
>;

function mockResolutions(packages: ({ name: string; path: string } | null)[]) {
  const resolutions: Record<string, any> = {};
  for (const [index, pkg] of packages.entries()) {
    if (pkg == null) {
      resolutions[`missing-${index}`] = undefined;
    } else {
      resolutions[pkg.name] = { name: pkg.name, version: '1.0.0', path: pkg.path };
    }
  }
  autolinking.makeCachedDependenciesLinker.mockReturnValue({
    scanDependenciesRecursively: jest.fn(async () => resolutions),
  } as any);
}

describe('discoverSkillsAsync', () => {
  afterEach(() => {
    vol.reset();
  });

  it('should discover a skill from a package with a skills directory', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/package.json': '{}',
      '/project/node_modules/foo/skills/my-skill/SKILL.md': [
        '---',
        'name: My Skill',
        'description: Does a thing',
        '---',
        '',
        '# My Skill',
      ].join('\n'),
    });
    mockResolutions([{ name: 'foo', path: '/project/node_modules/foo' }]);

    await expect(discoverSkillsAsync('/project')).resolves.toEqual([
      {
        name: 'my-skill',
        path: '/project/node_modules/foo/skills/my-skill',
        packageName: 'foo',
        linkName: 'my-skill',
        title: 'My Skill',
        description: 'Does a thing',
      },
    ]);
  });

  it('should parse frontmatter of a skill file with a large body', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/skills/big/SKILL.md': [
        '---',
        'name: Big Skill',
        'description: Ships a huge body',
        '---',
        '',
        'x'.repeat(64 * 1024),
      ].join('\n'),
    });
    mockResolutions([{ name: 'foo', path: '/project/node_modules/foo' }]);

    await expect(discoverSkillsAsync('/project')).resolves.toEqual([
      expect.objectContaining({
        name: 'big',
        title: 'Big Skill',
        description: 'Ships a huge body',
      }),
    ]);
  });

  it('should ignore frontmatter that closes beyond the read limit', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/skills/huge/SKILL.md': [
        '---',
        'name: Huge Skill',
        `comment: ${'x'.repeat(16 * 1024)}`,
        '---',
      ].join('\n'),
    });
    mockResolutions([{ name: 'foo', path: '/project/node_modules/foo' }]);

    const skills = await discoverSkillsAsync('/project');
    expect(skills).toEqual([expect.objectContaining({ name: 'huge' })]);
    expect(skills[0]?.title).toBeUndefined();
  });

  it('should discover multiple skills from a single package', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/skills/beta/SKILL.md': '# Beta',
      '/project/node_modules/foo/skills/alpha/SKILL.md': '# Alpha',
    });
    mockResolutions([{ name: 'foo', path: '/project/node_modules/foo' }]);

    const skills = await discoverSkillsAsync('/project');

    expect(skills.map((skill) => skill.name)).toEqual(['alpha', 'beta']);
  });

  it('should use the plain skill name as the link name', async () => {
    vol.fromJSON({
      '/project/node_modules/@expo/ui/skills/my-skill/SKILL.md': '# My Skill',
    });
    mockResolutions([{ name: '@expo/ui', path: '/project/node_modules/@expo/ui' }]);

    const skills = await discoverSkillsAsync('/project');

    expect(skills[0]?.linkName).toBe('my-skill');
  });

  it('should sort skills by package name and then skill name', async () => {
    vol.fromJSON({
      '/project/node_modules/zeta/skills/one/SKILL.md': '# One',
      '/project/node_modules/@expo/ui/skills/beta/SKILL.md': '# Beta',
      '/project/node_modules/@expo/ui/skills/alpha/SKILL.md': '# Alpha',
      '/project/node_modules/alpha-pkg/skills/only/SKILL.md': '# Only',
    });
    mockResolutions([
      { name: 'zeta', path: '/project/node_modules/zeta' },
      { name: '@expo/ui', path: '/project/node_modules/@expo/ui' },
      { name: 'alpha-pkg', path: '/project/node_modules/alpha-pkg' },
    ]);

    const skills = await discoverSkillsAsync('/project');

    expect(skills.map((skill) => `${skill.packageName}/${skill.name}`)).toEqual([
      '@expo/ui/alpha',
      '@expo/ui/beta',
      'alpha-pkg/only',
      'zeta/one',
    ]);
  });

  it('should skip packages without a skills directory', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/package.json': '{}',
    });
    mockResolutions([{ name: 'foo', path: '/project/node_modules/foo' }]);

    await expect(discoverSkillsAsync('/project')).resolves.toEqual([]);
  });

  it('should skip skill directories without a SKILL.md file', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/skills/valid/SKILL.md': '# Valid',
      '/project/node_modules/foo/skills/invalid/README.md': '# Invalid',
      '/project/node_modules/foo/skills/empty': null,
    });
    mockResolutions([{ name: 'foo', path: '/project/node_modules/foo' }]);

    const skills = await discoverSkillsAsync('/project');

    expect(skills.map((skill) => skill.name)).toEqual(['valid']);
  });

  it('should skip files directly inside the skills directory', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/skills/README.md': '# Not a skill',
      '/project/node_modules/foo/skills/valid/SKILL.md': '# Valid',
    });
    mockResolutions([{ name: 'foo', path: '/project/node_modules/foo' }]);

    const skills = await discoverSkillsAsync('/project');

    expect(skills.map((skill) => skill.name)).toEqual(['valid']);
  });

  it('should omit title and description when SKILL.md has no frontmatter', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/skills/my-skill/SKILL.md': '# My Skill',
    });
    mockResolutions([{ name: 'foo', path: '/project/node_modules/foo' }]);

    await expect(discoverSkillsAsync('/project')).resolves.toEqual([
      {
        name: 'my-skill',
        path: '/project/node_modules/foo/skills/my-skill',
        packageName: 'foo',
        linkName: 'my-skill',
      },
    ]);
  });

  it('should skip undefined dependency resolutions', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/skills/my-skill/SKILL.md': '# My Skill',
    });
    mockResolutions([null, { name: 'foo', path: '/project/node_modules/foo' }, null]);

    const skills = await discoverSkillsAsync('/project');

    expect(skills.map((skill) => skill.name)).toEqual(['my-skill']);
  });

  it('should skip skill entries that link outside the package root', async () => {
    vol.fromJSON({
      '/outside/evil-skill/SKILL.md': '# Evil',
      '/project/node_modules/foo/skills/safe/SKILL.md': '# Safe',
    });
    vol.symlinkSync('/outside/evil-skill', '/project/node_modules/foo/skills/evil');
    mockResolutions([{ name: 'foo', path: '/project/node_modules/foo' }]);

    const skills = await discoverSkillsAsync('/project');

    expect(skills.map((skill) => skill.name)).toEqual(['safe']);
  });

  it('should skip packages that cannot be read', async () => {
    vol.fromJSON({
      '/project/node_modules/foo/skills/my-skill/SKILL.md': '# My Skill',
    });
    mockResolutions([
      { name: 'foo', path: '/project/node_modules/foo' },
      { name: 'gone', path: '/project/node_modules/gone' },
    ]);

    const skills = await discoverSkillsAsync('/project');

    expect(skills.map((skill) => skill.name)).toEqual(['my-skill']);
  });
});

describe('parseSkillFrontmatter', () => {
  it('should parse the name and description', () => {
    const contents = [
      '---',
      'name: My Skill',
      'description: Does a thing',
      '---',
      '# Heading',
    ].join('\n');

    expect(parseSkillFrontmatter(contents)).toEqual({
      title: 'My Skill',
      description: 'Does a thing',
    });
  });

  it('should strip surrounding quotes from values', () => {
    const contents = ['---', 'name: "My Skill"', "description: 'Does a thing'", '---'].join('\n');

    expect(parseSkillFrontmatter(contents)).toEqual({
      title: 'My Skill',
      description: 'Does a thing',
    });
  });

  it('should parse frontmatter with CRLF line endings', () => {
    const contents = ['---', 'name: My Skill', '---', ''].join('\r\n');

    expect(parseSkillFrontmatter(contents)).toEqual({ title: 'My Skill' });
  });

  it('should ignore unknown and nested keys', () => {
    const contents = [
      '---',
      'name: My Skill',
      'metadata:',
      '  nested: value',
      '  description: Nested description',
      'license: MIT',
      '---',
    ].join('\n');

    expect(parseSkillFrontmatter(contents)).toEqual({ title: 'My Skill' });
  });

  it('should omit missing keys', () => {
    const contents = ['---', 'description: Does a thing', '---'].join('\n');

    expect(parseSkillFrontmatter(contents)).toEqual({ description: 'Does a thing' });
  });

  it('should return an empty object when there is no frontmatter', () => {
    expect(parseSkillFrontmatter('# My Skill\n\nname: My Skill')).toEqual({});
  });

  it('should return an empty object for empty contents', () => {
    expect(parseSkillFrontmatter('')).toEqual({});
  });

  it('should return an empty object when the closing delimiter is missing', () => {
    expect(parseSkillFrontmatter(['---', 'name: My Skill', '# Heading'].join('\n'))).toEqual({});
  });
});
