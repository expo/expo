import { IOSConfig, XcodeProject } from 'expo/config-plugins';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { addCrashReporterTarget } from '../ios/addCrashReporterTarget';

const TEMPLATE_PBXPROJ = path.join(
  __dirname,
  '../../../../../templates/expo-template-bare-minimum/ios/HelloWorld.xcodeproj/project.pbxproj'
);

const TARGET_NAME = 'ExpoObserveCrashReporter';

const defaultProps = {
  targetName: TARGET_NAME,
  bundleIdentifier: 'com.example.app.ExpoObserveCrashReporter',
  marketingVersion: '1.2.3',
  buildNumber: '42',
};

let projectRoot: string;

beforeEach(() => {
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-observe-plugin-'));
  const xcodeprojDir = path.join(projectRoot, 'ios', 'HelloWorld.xcodeproj');
  fs.mkdirSync(xcodeprojDir, { recursive: true });
  fs.copyFileSync(TEMPLATE_PBXPROJ, path.join(xcodeprojDir, 'project.pbxproj'));
});

afterEach(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

function loadProject(): XcodeProject {
  return IOSConfig.XcodeUtils.getPbxproj(projectRoot);
}

/**
 * Serializes the project and parses it again, so that assertions run against what Xcode reads,
 * not against the in-memory objects.
 */
function roundTrip(project: XcodeProject): XcodeProject {
  const pbxprojPath = path.join(projectRoot, 'ios', 'HelloWorld.xcodeproj', 'project.pbxproj');
  fs.writeFileSync(pbxprojPath, project.writeSync());
  return loadProject();
}

/**
 * Returns a pbxproj value as a plain string. The parser keeps quotes on quoted values and returns
 * bare numeric values as numbers.
 */
function unquote(value: unknown) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).replace(/^"(.*)"$/, '$1')
    : value;
}

function getObjects(project: XcodeProject): Record<string, any> {
  return project.hash.project.objects;
}

function getExtensionTarget(project: XcodeProject) {
  const target = project.pbxTargetByName(TARGET_NAME);
  expect(target).toBeDefined();
  return target!;
}

function getBuildSettings(project: XcodeProject): Record<string, Record<string, unknown>> {
  const objects = getObjects(project);
  const list = objects.XCConfigurationList[getExtensionTarget(project).buildConfigurationList];
  return Object.fromEntries(
    list.buildConfigurations.map(({ value }: { value: string }) => {
      const configuration = objects.XCBuildConfiguration[value];
      return [unquote(configuration.name), configuration.buildSettings];
    })
  );
}

function getAppTarget(project: XcodeProject) {
  return project.getFirstTarget().firstTarget;
}

describe(addCrashReporterTarget, () => {
  it('adds an ExtensionKit extension target', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const result = roundTrip(project);
    const target = getExtensionTarget(result);
    expect(unquote(target.productType)).toBe('com.apple.product-type.extensionkit-extension');

    const objects = getObjects(result);
    const productFile = objects.PBXFileReference[target.productReference];
    expect(unquote(productFile.explicitFileType)).toBe('wrapper.extensionkit-extension');
    expect(unquote(productFile.path)).toBe(`${TARGET_NAME}.appex`);
    expect(productFile.sourceTree).toBe('BUILT_PRODUCTS_DIR');

    const pbxProject = objects.PBXProject[result.getFirstProject().uuid];
    expect(pbxProject.targets.map(({ value }: { value: string }) => value)).toContain(
      result.findTargetKey(TARGET_NAME)
    );
  });

  it('compiles the generated Swift file in the extension target', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const result = roundTrip(project);
    const objects = getObjects(result);
    const sourcesPhase = getExtensionTarget(result)
      .buildPhases.map(({ value }: { value: string }) => objects.PBXSourcesBuildPhase?.[value])
      .find(Boolean);
    expect(sourcesPhase.files).toHaveLength(1);
    const buildFile = objects.PBXBuildFile[sourcesPhase.files[0].value];
    expect(unquote(objects.PBXFileReference[buildFile.fileRef].path)).toBe(`${TARGET_NAME}.swift`);
  });

  it('adds a group with the extension files to the main group', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const result = roundTrip(project);
    const objects = getObjects(result);
    const mainGroup = objects.PBXGroup[objects.PBXProject[result.getFirstProject().uuid].mainGroup];
    const group = mainGroup.children
      .map(({ value }: { value: string }) => objects.PBXGroup[value])
      .find((child: any) => child && unquote(child.path) === TARGET_NAME);
    expect(group).toBeDefined();
    const fileNames = group.children.map(
      ({ value }: { value: string }) => objects.PBXFileReference[value].path
    );
    expect(fileNames.map(unquote).sort()).toEqual(['ExpoObserveCrashReporter.swift', 'Info.plist']);
  });

  it('configures build settings for every app configuration', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const settings = getBuildSettings(roundTrip(project));
    expect(Object.keys(settings).sort()).toEqual(['Debug', 'Release']);
    for (const buildSettings of Object.values(settings)) {
      expect(
        Object.fromEntries(Object.entries(buildSettings).map(([k, v]) => [k, unquote(v)]))
      ).toMatchObject({
        PRODUCT_BUNDLE_IDENTIFIER: 'com.example.app.ExpoObserveCrashReporter',
        PRODUCT_NAME: '$(TARGET_NAME)',
        INFOPLIST_FILE: 'ExpoObserveCrashReporter/Info.plist',
        GENERATE_INFOPLIST_FILE: 'YES',
        IPHONEOS_DEPLOYMENT_TARGET: '27.0',
        MARKETING_VERSION: '1.2.3',
        CURRENT_PROJECT_VERSION: '42',
        LD_RUNPATH_SEARCH_PATHS:
          '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks',
        SKIP_INSTALL: 'YES',
      });
      expect(buildSettings.DEVELOPMENT_TEAM).toBeUndefined();
    }
  });

  it('builds the Debug configuration unoptimized and with the DEBUG condition, like the app', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const settings = getBuildSettings(roundTrip(project));
    expect(unquote(settings.Debug?.SWIFT_OPTIMIZATION_LEVEL)).toBe('-Onone');
    expect(unquote(settings.Debug?.SWIFT_ACTIVE_COMPILATION_CONDITIONS)).toBe('DEBUG $(inherited)');
    expect(settings.Release?.SWIFT_OPTIMIZATION_LEVEL).toBeUndefined();
    expect(settings.Release?.SWIFT_ACTIVE_COMPILATION_CONDITIONS).toBeUndefined();
  });

  it('uses the given development team', () => {
    const project = loadProject();
    addCrashReporterTarget(project, { ...defaultProps, developmentTeam: 'ABCDE12345' });
    for (const buildSettings of Object.values(getBuildSettings(roundTrip(project)))) {
      expect(buildSettings.DEVELOPMENT_TEAM).toBe('ABCDE12345');
    }
  });

  it("falls back to the app target's development team", () => {
    const project = loadProject();
    const objects = getObjects(project);
    const appList = objects.XCConfigurationList[getAppTarget(project).buildConfigurationList];
    for (const { value } of appList.buildConfigurations) {
      objects.XCBuildConfiguration[value].buildSettings.DEVELOPMENT_TEAM = 'FGHIJ67890';
    }
    addCrashReporterTarget(project, defaultProps);
    for (const buildSettings of Object.values(getBuildSettings(roundTrip(project)))) {
      expect(buildSettings.DEVELOPMENT_TEAM).toBe('FGHIJ67890');
    }
  });

  it("falls back to the app target's quoted development team", () => {
    const project = loadProject();
    const objects = getObjects(project);
    const appList = objects.XCConfigurationList[getAppTarget(project).buildConfigurationList];
    for (const { value } of appList.buildConfigurations) {
      objects.XCBuildConfiguration[value].buildSettings.DEVELOPMENT_TEAM = '"FGHIJ67890"';
    }
    addCrashReporterTarget(project, defaultProps);
    for (const buildSettings of Object.values(getBuildSettings(roundTrip(project)))) {
      expect(unquote(buildSettings.DEVELOPMENT_TEAM)).toBe('FGHIJ67890');
    }
  });

  it('embeds the extension in the app target', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const result = roundTrip(project);
    const objects = getObjects(result);
    const embedPhases = getAppTarget(result)
      .buildPhases.map(({ value }: { value: string }) => objects.PBXCopyFilesBuildPhase?.[value])
      .filter(Boolean);
    expect(embedPhases).toHaveLength(1);

    const [embedPhase] = embedPhases;
    expect(unquote(embedPhase.name)).toBe('Embed ExtensionKit Extensions');
    expect(unquote(embedPhase.dstPath)).toBe('$(EXTENSIONS_FOLDER_PATH)');
    expect(Number(embedPhase.dstSubfolderSpec)).toBe(16);
    expect(embedPhase.files).toHaveLength(1);
    const buildFile = objects.PBXBuildFile[embedPhase.files[0].value];
    expect(buildFile.fileRef).toBe(getExtensionTarget(result).productReference);
  });

  it('makes the app target depend on the extension target', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const result = roundTrip(project);
    const objects = getObjects(result);
    const extensionTargetUuid = result.findTargetKey(TARGET_NAME);
    const dependencies = getAppTarget(result).dependencies.map(
      ({ value }: { value: string }) => objects.PBXTargetDependency[value]
    );
    expect(dependencies).toHaveLength(1);
    expect(dependencies[0].target).toBe(extensionTargetUuid);
    const proxy = objects.PBXContainerItemProxy[dependencies[0].targetProxy];
    expect(proxy.remoteGlobalIDString).toBe(extensionTargetUuid);
    expect(proxy.containerPortal).toBe(result.getFirstProject().uuid);
  });

  it('updates the bundle identifier of an existing target', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const once = roundTrip(project);
    addCrashReporterTarget(once, { ...defaultProps, bundleIdentifier: 'com.example.app.crashes' });
    const result = roundTrip(once);
    const targetNames = Object.values(result.pbxNativeTargetSection())
      .filter((target: any) => typeof target === 'object')
      .map((target: any) => unquote(target.name));
    expect(targetNames.filter((name) => name === TARGET_NAME)).toHaveLength(1);
    for (const buildSettings of Object.values(getBuildSettings(result))) {
      expect(unquote(buildSettings.PRODUCT_BUNDLE_IDENTIFIER)).toBe('com.example.app.crashes');
    }
  });

  it('updates the versions and development team of an existing target', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const once = roundTrip(project);
    addCrashReporterTarget(once, {
      ...defaultProps,
      marketingVersion: '2.0.0',
      buildNumber: '43',
      developmentTeam: 'ABCDE12345',
    });
    for (const buildSettings of Object.values(getBuildSettings(roundTrip(once)))) {
      expect(unquote(buildSettings.MARKETING_VERSION)).toBe('2.0.0');
      expect(unquote(buildSettings.CURRENT_PROJECT_VERSION)).toBe('43');
      expect(unquote(buildSettings.DEVELOPMENT_TEAM)).toBe('ABCDE12345');
    }
  });

  it('keeps settings that the plugin does not manage on an existing target', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const once = roundTrip(project);
    const objects = getObjects(once);
    const list = objects.XCConfigurationList[getExtensionTarget(once).buildConfigurationList];
    for (const { value } of list.buildConfigurations) {
      objects.XCBuildConfiguration[value].buildSettings.OTHER_SWIFT_FLAGS = '"-DCUSTOM"';
    }
    addCrashReporterTarget(once, defaultProps);
    for (const buildSettings of Object.values(getBuildSettings(roundTrip(once)))) {
      expect(unquote(buildSettings.OTHER_SWIFT_FLAGS)).toBe('-DCUSTOM');
    }
  });

  it('does not change the project when run again with the same options', () => {
    const project = loadProject();
    addCrashReporterTarget(project, defaultProps);
    const once = roundTrip(project);
    const serialized = once.writeSync();
    addCrashReporterTarget(once, defaultProps);
    expect(once.writeSync()).toBe(serialized);
  });
});
