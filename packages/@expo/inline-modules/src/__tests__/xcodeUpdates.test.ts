import { IOSConfig } from '@expo/config-plugins';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { updateXcodeProject } from '../xcodeProjectUpdates';

// A second application target ("WatchApp"), listed before the fixture's
// "HelloWorld" target — a paired watchOS app also uses the application
// product type.
const addWatchAppTarget = (content: string) =>
  content
    .replace('targets = (', 'targets = (\n\t\t\t\tBBBBBBBBBBBBBBBBBBBBBBBB /* WatchApp */,')
    .replace(
      '/* Begin PBXNativeTarget section */',
      '/* Begin PBXNativeTarget section */\n' +
        '\t\tBBBBBBBBBBBBBBBBBBBBBBBB /* WatchApp */ = {\n' +
        '\t\t\tisa = PBXNativeTarget;\n' +
        '\t\t\tbuildConfigurationList = F43ABE392F2366380051AD1C;\n' +
        '\t\t\tbuildPhases = (\n' +
        '\t\t\t);\n' +
        '\t\t\tbuildRules = (\n' +
        '\t\t\t);\n' +
        '\t\t\tdependencies = (\n' +
        '\t\t\t);\n' +
        '\t\t\tname = WatchApp;\n' +
        '\t\t\tproductName = WatchApp;\n' +
        '\t\t\tproductType = "com.apple.product-type.application";\n' +
        '\t\t};'
    );

// An aggregate target ("Scripts"), listed before the fixture's application
// target. Aggregate targets are not part of the PBXNativeTarget section.
const addAggregateTarget = (content: string) =>
  content
    .replace('targets = (', 'targets = (\n\t\t\t\tAAAAAAAAAAAAAAAAAAAAAAAA /* Scripts */,')
    .replace(
      '/* Begin PBXNativeTarget section */',
      '/* Begin PBXAggregateTarget section */\n' +
        '\t\tAAAAAAAAAAAAAAAAAAAAAAAA /* Scripts */ = {\n' +
        '\t\t\tisa = PBXAggregateTarget;\n' +
        '\t\t\tbuildConfigurationList = F43ABE392F2366380051AD1C;\n' +
        '\t\t\tbuildPhases = (\n' +
        '\t\t\t);\n' +
        '\t\t\tdependencies = (\n' +
        '\t\t\t);\n' +
        '\t\t\tname = Scripts;\n' +
        '\t\t};\n' +
        '/* End PBXAggregateTarget section */\n\n' +
        '/* Begin PBXNativeTarget section */'
    );

// Replaces the whole PBXNativeTarget section with an aggregate target, so no
// PBXNativeTarget section exists at all.
const replaceNativeTargetsWithAggregate = (content: string) =>
  content.replace(
    /\/\* Begin PBXNativeTarget section \*\/[\s\S]*?\/\* End PBXNativeTarget section \*\//,
    '/* Begin PBXAggregateTarget section */\n' +
      '\t\tF43ABE372F2366380051AD1C /* Scripts */ = {\n' +
      '\t\t\tisa = PBXAggregateTarget;\n' +
      '\t\t\tbuildConfigurationList = F43ABE392F2366380051AD1C;\n' +
      '\t\t\tbuildPhases = (\n' +
      '\t\t\t);\n' +
      '\t\t\tdependencies = (\n' +
      '\t\t\t);\n' +
      '\t\t\tname = Scripts;\n' +
      '\t\t};\n' +
      '/* End PBXAggregateTarget section */'
  );

describe('updateXcodeProject', () => {
  let tempProjectRoot: string;
  const FIXTURE_PATH = path.resolve(__dirname, 'fixtures/bare-project');

  const pbxProjPath = () =>
    path.join(tempProjectRoot, 'ios', 'bare-project.xcodeproj', 'project.pbxproj');

  const mutatePbxproj = async (mutate: (content: string) => string) => {
    const content = await fs.promises.readFile(pbxProjPath(), 'utf8');
    await fs.promises.writeFile(pbxProjPath(), mutate(content));
  };

  const getTargetByName = (name: string) => {
    const nativeTargets =
      IOSConfig.XcodeUtils.getPbxproj(tempProjectRoot).hash.project.objects.PBXNativeTarget;
    return Object.values(nativeTargets).find(
      (target) => typeof target === 'object' && target?.name === name
    ) as { fileSystemSynchronizedGroups?: { value: string; comment?: string }[] } | undefined;
  };

  const expectAppGroupOnTarget = (name: string) => {
    expect(getTargetByName(name)?.fileSystemSynchronizedGroups).toEqual(
      expect.arrayContaining([expect.objectContaining({ comment: 'app' })])
    );
  };

  beforeEach(async () => {
    tempProjectRoot = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'xcode-updates-test-'));
    await fs.promises.cp(FIXTURE_PATH, tempProjectRoot, { recursive: true });
  });

  afterEach(async () => {
    if (fs.existsSync(tempProjectRoot)) {
      await fs.promises.rm(tempProjectRoot, { recursive: true, force: true });
    }
    jest.resetAllMocks();
  });

  it('adds watched directories to the PBX project', async () => {
    await updateXcodeProject(tempProjectRoot, { watchedDirectories: ['app'] });

    const objects = IOSConfig.XcodeUtils.getPbxproj(tempProjectRoot).hash.project.objects;
    const rootGroups = objects.PBXFileSystemSynchronizedRootGroup;
    expect(rootGroups).toBeDefined();

    const rootGroupKeys = Object.keys(rootGroups).filter((key) => !key.endsWith('_comment'));
    expect(rootGroupKeys).toHaveLength(1);
    expect(rootGroups[rootGroupKeys[0]!]).toEqual(
      expect.objectContaining({
        isa: 'PBXFileSystemSynchronizedRootGroup',
        name: 'app',
      })
    );
  });

  it('resolves the main target by its application product type', async () => {
    // The fixture's main target "HelloWorld" matches neither the .xcodeproj name
    // nor any app name; only its product type identifies it.
    await updateXcodeProject(tempProjectRoot, { watchedDirectories: ['app'] });

    expectAppGroupOnTarget('HelloWorld');
  });

  it('ignores aggregate targets when resolving the main target', async () => {
    // Aggregate targets are not in the PBXNativeTarget section; resolving the
    // main target must not crash on them.
    await mutatePbxproj(addAggregateTarget);

    await updateXcodeProject(tempProjectRoot, { watchedDirectories: ['app'] });

    expectAppGroupOnTarget('HelloWorld');
  });

  it('prefers the application target named after the project when there are several', async () => {
    // The watch app comes first in target order; the on-disk project name must win.
    await mutatePbxproj(addWatchAppTarget);
    // `getProjectName` resolves "HelloWorld" from the AppDelegate location.
    const sourceRoot = path.join(tempProjectRoot, 'ios', 'HelloWorld');
    await fs.promises.mkdir(sourceRoot, { recursive: true });
    await fs.promises.writeFile(path.join(sourceRoot, 'AppDelegate.swift'), '// placeholder\n');

    await updateXcodeProject(tempProjectRoot, { watchedDirectories: ['app'] });

    expectAppGroupOnTarget('HelloWorld');
    expect(getTargetByName('WatchApp')?.fileSystemSynchronizedGroups).toBeUndefined();
  });

  it('warns and uses the first application target when the name tiebreak fails', async () => {
    // Two application targets, no AppDelegate on disk to break the tie.
    await mutatePbxproj(addWatchAppTarget);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await updateXcodeProject(tempProjectRoot, { watchedDirectories: ['app'] });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('multiple application targets'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WatchApp'));
    } finally {
      warnSpy.mockRestore();
    }

    expectAppGroupOnTarget('WatchApp');
  });

  it('uses the sanitized app name as tiebreak when no source folder is on disk', async () => {
    // Two application targets, no AppDelegate on disk. 'Hello World!' sanitizes
    // to 'HelloWorld', proving the app name is sanitized before comparison.
    await mutatePbxproj(addWatchAppTarget);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await updateXcodeProject(tempProjectRoot, {
        watchedDirectories: ['app'],
        appName: 'Hello World!',
      });
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }

    expectAppGroupOnTarget('HelloWorld');
    expect(getTargetByName('WatchApp')?.fileSystemSynchronizedGroups).toBeUndefined();
  });

  it('prefers the on-disk project name over the app name for the tiebreak', async () => {
    await mutatePbxproj(addWatchAppTarget);
    // `getProjectName` resolves "HelloWorld" from the AppDelegate location.
    const sourceRoot = path.join(tempProjectRoot, 'ios', 'HelloWorld');
    await fs.promises.mkdir(sourceRoot, { recursive: true });
    await fs.promises.writeFile(path.join(sourceRoot, 'AppDelegate.swift'), '// placeholder\n');

    await updateXcodeProject(tempProjectRoot, {
      watchedDirectories: ['app'],
      appName: 'WatchApp',
    });

    expectAppGroupOnTarget('HelloWorld');
  });

  it('matches explicit xcodeProjectTargets against quoted target names', async () => {
    // pbxproj quotes names containing spaces; the user config value is unquoted.
    await mutatePbxproj((content) =>
      content.replace('name = HelloWorld;', 'name = "Hello World";')
    );

    await updateXcodeProject(tempProjectRoot, {
      watchedDirectories: ['app'],
      xcodeProjectTargets: ['Hello World'],
    });

    expectAppGroupOnTarget('"Hello World"');
  });

  it('throws a descriptive error when no target has the application product type', async () => {
    await mutatePbxproj((content) => content.replace(/^.*productType.*\n/m, ''));

    await expect(
      updateXcodeProject(tempProjectRoot, { watchedDirectories: ['app'] })
    ).rejects.toThrow('could not find an application target');
  });

  it('throws the descriptive error for a project with only aggregate targets', async () => {
    // No PBXNativeTarget section at all; must reach the descriptive error, not a TypeError.
    await mutatePbxproj(replaceNativeTargetsWithAggregate);

    await expect(
      updateXcodeProject(tempProjectRoot, { watchedDirectories: ['app'] })
    ).rejects.toThrow('could not find an application target');
  });

  it('does nothing if watchedDirectories is empty', async () => {
    const contentBefore = await fs.promises.readFile(pbxProjPath(), 'utf8');
    expect(contentBefore).toBeTruthy();

    await updateXcodeProject(tempProjectRoot, { watchedDirectories: [] });

    const contentAfter = await fs.promises.readFile(pbxProjPath(), 'utf8');
    expect(contentAfter).toEqual(contentBefore);
  });
});
