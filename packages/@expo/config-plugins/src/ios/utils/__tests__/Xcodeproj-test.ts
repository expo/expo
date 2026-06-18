import { vol } from 'memfs';

import type { XcodeProject } from '../../../Plugin.types';
import rnFixture from '../../../plugins/__tests__/fixtures/react-native-project';
import {
  addBuildSourceFileToGroup,
  addFramework,
  addResourceFileToGroup,
  ensureGroupRecursively,
  getApplicationNativeTarget,
  getBuildConfigurationForListIdAndName,
  getBuildConfigurationsForListId,
  getPbxproj,
  getProductName,
  getXCConfigurationListEntries,
  resolvePathOrProject,
  resolveXcodeBuildSetting,
  sanitizedName,
} from '../Xcodeproj';

jest.mock('fs');

describe(sanitizedName, () => {
  it(`formats basic name`, () => {
    expect(sanitizedName('bacon')).toBe('bacon');
  });
  it(`formats android/xcode unsupported name`, () => {
    expect(sanitizedName('あいう')).toBe('app');
  });
  it(`uses slugify for better name support`, () => {
    expect(sanitizedName('\u2665')).toBe('love');
  });
});

describe(resolveXcodeBuildSetting, () => {
  it(`resolves build setting`, () => {
    const lookup = jest.fn(
      (v) =>
        ({
          CURRENT_VARIANT: 'variant',
          PLATFORM_PREFERRED_ARCH: 'arch',
          LINK_FILE_LIST_variant_arch: './../foo/./bar.js',
        })[v]
    );
    const r = resolveXcodeBuildSetting(
      '$(LINK_FILE_LIST_$(CURRENT_VARIANT)_$(PLATFORM_PREFERRED_ARCH):dir:standardizepath:file:default=arm64)',
      lookup
    );
    expect(lookup).toHaveBeenNthCalledWith(1, 'CURRENT_VARIANT');
    expect(lookup).toHaveBeenNthCalledWith(2, 'PLATFORM_PREFERRED_ARCH');
    expect(lookup).toHaveBeenNthCalledWith(3, 'LINK_FILE_LIST_variant_arch');
    expect(lookup).toHaveBeenCalledTimes(3);
    expect(r).toBe('foo');
  });
  it(`resolves build setting using "default" modifier`, () => {
    const lookup = jest.fn((v) => ({})[v]);
    const r = resolveXcodeBuildSetting('$(LINK_FILE_LIST:default=arm64)', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'LINK_FILE_LIST');
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(r).toBe('arm64');
  });
  it(`resolves build settings looked up with more build settings`, () => {
    const lookup = jest.fn((v) => ({ FOO: '$(BAR:lower)', BAR: '$(hey)', hey: 'Found' })[v]);
    const r = resolveXcodeBuildSetting('$(FOO)', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'FOO');
    expect(lookup).toHaveBeenNthCalledWith(2, 'BAR');
    expect(lookup).toHaveBeenNthCalledWith(3, 'hey');
    expect(lookup).toHaveBeenCalledTimes(3);
    expect(r).toBe('found');
  });
  it(`resolves build setting using "default" modifier with variable`, () => {
    const lookup = jest.fn((v) => ({ FOO: 'FOO' })[v]);
    const r = resolveXcodeBuildSetting('$(LINK_FILE_LIST:default=$(FOO:lower))', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'FOO');
    expect(lookup).toHaveBeenNthCalledWith(2, 'LINK_FILE_LIST');
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(r).toBe('foo');
  });
  it(`resolves with "rfc1034identifier" modifier`, () => {
    const lookup = jest.fn((v) => ({ FOO: 'ab/cd-e_f.g h*' })[v]);
    const r = resolveXcodeBuildSetting('$(FOO:rfc1034identifier)', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'FOO');
    expect(r).toBe('ab-cd-e-f-g-h-');
  });
  it(`resolves with "c99extidentifier" modifier`, () => {
    const lookup = jest.fn((v) => ({ FOO: 'ab/cd-e_f.g h*' })[v]);
    const r = resolveXcodeBuildSetting('$(FOO:c99extidentifier)', lookup);
    expect(lookup).toHaveBeenNthCalledWith(1, 'FOO');
    expect(r).toBe('ab/cd_e_f.g_h*');
  });
  it(`resolves with "base" modifier`, () => {
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: '/foo/bar.js' })[v])).toBe('bar');
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: '/foo/bar' })[v])).toBe('bar');
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: '/foo/bar.' })[v])).toBe('bar');
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: '/foo/bar.d.ts' })[v])).toBe(
      'bar.d'
    );
    expect(resolveXcodeBuildSetting('$(FOO:base)', (v) => ({ FOO: 'bar.ts' })[v])).toBe('bar');
  });
  it(`resolves with "suffix" modifier`, () => {
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: '/foo/bar.js' })[v])).toBe(
      '.js'
    );
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: '/foo/bar' })[v])).toBe('');
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: '/foo/bar.' })[v])).toBe('.');
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: '/foo/bar.d.ts' })[v])).toBe(
      '.ts'
    );
    expect(resolveXcodeBuildSetting('$(FOO:suffix)', (v) => ({ FOO: 'bar.ts' })[v])).toBe('.ts');
  });

  it(`resolves a common bundle identifier pattern`, () => {
    expect(
      resolveXcodeBuildSetting(
        'org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)',
        (setting) => ({ PRODUCT_NAME: 'foo_-bar' })[setting]
      )
    ).toBe('org.reactjs.native.example.foo--bar');
  });
});

describe('Xcodeproj pbxproj utilities', () => {
  const projectRoot = '/app';
  const pbxProjPath = 'ios/HelloWorld.xcodeproj/project.pbxproj';
  let project: XcodeProject;

  beforeEach(() => {
    vol.fromJSON(
      { [pbxProjPath]: rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'] },
      projectRoot
    );
    project = getPbxproj(projectRoot);
  });

  afterEach(() => vol.reset());

  describe(resolvePathOrProject, () => {
    it('returns the project when given a parsed XcodeProject', () => {
      expect(resolvePathOrProject(project)).toBe(project);
    });

    it('loads and parses the project when given a project root', () => {
      const loaded = resolvePathOrProject(projectRoot);
      expect(loaded).not.toBeNull();
      expect(loaded!.filepath).toContain('project.pbxproj');
    });

    it('returns null when the project does not exist', () => {
      expect(resolvePathOrProject('/does-not-exist')).toBeNull();
    });
  });

  describe(getApplicationNativeTarget, () => {
    it('returns the application target matching the project name', () => {
      const target = getApplicationNativeTarget({ project, projectName: 'HelloWorld' });
      expect(target.target.name).toBe('HelloWorld');
      expect(target.target.productType).toContain('com.apple.product-type.application');
    });

    it('throws when the project name does not match the application target', () => {
      expect(() => getApplicationNativeTarget({ project, projectName: 'WrongName' })).toThrow();
    });
  });

  describe(getProductName, () => {
    it('returns the productName build setting', () => {
      expect(getProductName(project)).toBe('HelloWorld');
    });
  });

  describe(getXCConfigurationListEntries, () => {
    it('returns configuration list entries without _comment keys', () => {
      const entries = getXCConfigurationListEntries(project);
      expect(entries.length).toBeGreaterThan(0);
      for (const [key] of entries) {
        expect(key.endsWith('_comment')).toBe(false);
      }
    });
  });

  describe(getBuildConfigurationsForListId, () => {
    it('returns the Debug and Release build configurations for the application target', () => {
      const target = getApplicationNativeTarget({ project, projectName: 'HelloWorld' });
      const entries = getBuildConfigurationsForListId(
        project,
        target.target.buildConfigurationList
      );
      const names = entries.map(([, c]) => c.name).sort();
      expect(names).toEqual(['Debug', 'Release']);
    });
  });

  describe(getBuildConfigurationForListIdAndName, () => {
    it('returns the configuration that matches the requested name', () => {
      const target = getApplicationNativeTarget({ project, projectName: 'HelloWorld' });
      const [, debug] = getBuildConfigurationForListIdAndName(project, {
        configurationListId: target.target.buildConfigurationList,
        buildConfiguration: 'Debug',
      });
      expect(debug.name).toBe('Debug');
    });

    it('throws when the requested configuration does not exist', () => {
      const target = getApplicationNativeTarget({ project, projectName: 'HelloWorld' });
      expect(() =>
        getBuildConfigurationForListIdAndName(project, {
          configurationListId: target.target.buildConfigurationList,
          buildConfiguration: 'Bogus',
        })
      ).toThrow();
    });
  });

  describe(ensureGroupRecursively, () => {
    it('creates nested groups under an existing group', () => {
      const group = ensureGroupRecursively(project, 'HelloWorld/Generated/Sources');
      expect(group).not.toBeNull();
      expect(group!.name).toBe('Sources');
      expect(project.pbxGroupByName('Generated')).toBeDefined();
      expect(project.pbxGroupByName('Sources')).toBeDefined();
    });

    it('returns the same group when called twice for the same path', () => {
      ensureGroupRecursively(project, 'HelloWorld/Generated');
      const first = project.pbxGroupByName('Generated');
      ensureGroupRecursively(project, 'HelloWorld/Generated');
      const second = project.pbxGroupByName('Generated');
      expect(first).toBe(second);
    });
  });

  describe(addResourceFileToGroup, () => {
    it('registers the file reference and adds it to the resources build phase', () => {
      const filepath = 'HelloWorld/new-resource.png';
      addResourceFileToGroup({
        filepath,
        groupName: 'HelloWorld',
        project,
        isBuildFile: true,
      });

      // file reference registered
      expect(project.hasFile(filepath)).toBeTruthy();

      // file appears as a child of the HelloWorld group
      const group = project.pbxGroupByName('HelloWorld');
      expect(group?.children.some((child: any) => child.comment === 'new-resource.png')).toBe(true);

      // file appears in the resources build phase section of the serialized output
      const output = project.writeSync();
      const resourcesRegion = output.match(
        /Begin PBXResourcesBuildPhase[\s\S]*?End PBXResourcesBuildPhase/
      );
      expect(resourcesRegion?.[0]).toContain('new-resource.png');
    });

    it('does not duplicate a file that is already present in the group', () => {
      const filepath = 'HelloWorld/dup-resource.png';
      addResourceFileToGroup({ filepath, groupName: 'HelloWorld', project, isBuildFile: true });

      const fileRefCountBefore = Object.keys(project.pbxFileReferenceSection()).length;
      addResourceFileToGroup({ filepath, groupName: 'HelloWorld', project, isBuildFile: true });
      const fileRefCountAfter = Object.keys(project.pbxFileReferenceSection()).length;

      expect(fileRefCountAfter).toBe(fileRefCountBefore);
    });

    it('skips adding to the build file section when isBuildFile is false', () => {
      const buildFileCountBefore = Object.keys(project.pbxBuildFileSection()).length;
      addResourceFileToGroup({
        filepath: 'HelloWorld/readme-only.txt',
        groupName: 'HelloWorld',
        project,
        isBuildFile: false,
      });
      const buildFileCountAfter = Object.keys(project.pbxBuildFileSection()).length;
      expect(buildFileCountAfter).toBe(buildFileCountBefore);
    });
  });

  describe(addBuildSourceFileToGroup, () => {
    it('registers the file reference and adds it to the sources build phase', () => {
      const filepath = 'HelloWorld/MyClass.swift';
      addBuildSourceFileToGroup({
        filepath,
        groupName: 'HelloWorld',
        project,
      });

      expect(project.hasFile(filepath)).toBeTruthy();

      // file appears in the sources build phase section of the serialized output
      const output = project.writeSync();
      const sourcesRegion = output.match(
        /Begin PBXSourcesBuildPhase[\s\S]*?End PBXSourcesBuildPhase/
      );
      expect(sourcesRegion?.[0]).toContain('MyClass.swift');
    });
  });

  describe(addFramework, () => {
    it('adds the framework to the application target', () => {
      addFramework({
        project,
        projectName: 'HelloWorld',
        framework: 'StoreKit.framework',
      });

      const output = project.writeSync();
      const frameworksRegion = output.match(
        /Begin PBXFrameworksBuildPhase[\s\S]*?End PBXFrameworksBuildPhase/
      );
      expect(frameworksRegion?.[0]).toContain('StoreKit.framework');
    });
  });
});
