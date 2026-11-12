import type { ExpoConfig } from 'expo/config';
import { IOSConfig, withXcodeProject, type XcodeProject } from 'expo/config-plugins';
import * as path from 'path';

import withTargetXcodeProject from '../ios/xcode/withTargetXcodeProject';
import { mockModWithResults } from './mockMods';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withXcodeProject: jest.fn(),
  };
});

const templateRoot = path.resolve(__dirname, '../../../../../templates/expo-template-bare-minimum');
const targetName = 'ExpoWidgetsTarget';
const widgetsPackagePath = 'build/generated/autolinking/expo/direct/expo-widgets';

type PbxObject = Record<string, any>;
type PbxSection = Record<string, PbxObject>;

function applyPlugin(xcodeProject: XcodeProject, experiments?: Record<string, unknown>) {
  mockModWithResults(withXcodeProject, xcodeProject);
  const config = {
    name: 'test',
    slug: 'test',
    experiments,
    modRequest: { platformProjectRoot: '/app/ios', projectName: 'HelloWorld' },
  } as unknown as ExpoConfig;
  withTargetXcodeProject(config, {
    targetName,
    bundleIdentifier: 'com.example.app.ExpoWidgetsTarget',
    deploymentTarget: '16.4',
    getFileUris: () => [],
  });
}

function objects(xcodeProject: XcodeProject, isa: string): PbxSection {
  const sections: Record<string, PbxSection | undefined> = xcodeProject.hash.project.objects;
  return sections[isa] ?? {};
}

function object(xcodeProject: XcodeProject, isa: string, uuid: string): PbxObject {
  return objects(xcodeProject, isa)[uuid]!;
}

function section(xcodeProject: XcodeProject, isa: string): [string, PbxObject][] {
  return Object.entries(objects(xcodeProject, isa)).filter(([key]) => !key.endsWith('_comment'));
}

function only<T>(items: T[]): T {
  expect(items).toHaveLength(1);
  return items[0]!;
}

function unquote(value: string): string {
  return value.replace(/^"(.*)"$/, '$1');
}

function widgetsTarget(xcodeProject: XcodeProject): PbxObject {
  return object(xcodeProject, 'PBXNativeTarget', xcodeProject.findTargetKey(targetName)!);
}

function targetPhases(xcodeProject: XcodeProject): { uuid: string; name: string }[] {
  return widgetsTarget(xcodeProject).buildPhases.map(
    ({ value, comment }: { value: string; comment: string }) => ({ uuid: value, name: comment })
  );
}

function targetConfigurations(xcodeProject: XcodeProject): PbxObject[] {
  const listUuid = widgetsTarget(xcodeProject).buildConfigurationList;
  return object(xcodeProject, 'XCConfigurationList', listUuid).buildConfigurations.map(
    ({ value }: { value: string }) => object(xcodeProject, 'XCBuildConfiguration', value)
  );
}

function widgetsPackageReferences(xcodeProject: XcodeProject) {
  return section(xcodeProject, 'XCLocalSwiftPackageReference').filter(
    ([, ref]) => unquote(ref.relativePath) === widgetsPackagePath
  );
}

function widgetsProductDependencies(xcodeProject: XcodeProject) {
  return section(xcodeProject, 'XCSwiftPackageProductDependency').filter(
    ([, dependency]) => dependency.productName === 'ExpoWidgets'
  );
}

function shellPhase(xcodeProject: XcodeProject, name: string): PbxObject {
  const phase = targetPhases(xcodeProject).find((phase) => phase.name === name);
  return object(xcodeProject, 'PBXShellScriptBuildPhase', phase!.uuid);
}

describe(withTargetXcodeProject, () => {
  let xcodeProject: XcodeProject;

  beforeEach(() => {
    jest.clearAllMocks();
    xcodeProject = IOSConfig.XcodeUtils.getPbxproj(templateRoot);
  });

  describe('with experiments.swiftPackageManager enabled', () => {
    beforeEach(() => {
      applyPlugin(xcodeProject, { swiftPackageManager: true });
    });

    it('references the expo-widgets Swift package from the project', () => {
      const [referenceUuid] = only(widgetsPackageReferences(xcodeProject));
      const project = object(xcodeProject, 'PBXProject', xcodeProject.getFirstProject().uuid);
      expect(project.packageReferences.map(({ value }: { value: string }) => value)).toEqual([
        referenceUuid,
      ]);
    });

    it('links the ExpoWidgets product into the extension target', () => {
      const [referenceUuid] = only(widgetsPackageReferences(xcodeProject));
      const [dependencyUuid, dependency] = only(widgetsProductDependencies(xcodeProject));
      expect(dependency.package).toBe(referenceUuid);

      const target = widgetsTarget(xcodeProject);
      expect(
        target.packageProductDependencies.map(({ value }: { value: string }) => value)
      ).toEqual([dependencyUuid]);

      const frameworksPhase = targetPhases(xcodeProject).find(({ name }) => name === 'Frameworks')!;
      const frameworkFiles = object(
        xcodeProject,
        'PBXFrameworksBuildPhase',
        frameworksPhase.uuid
      ).files.map(({ value }: { value: string }) => value);
      expect(
        frameworkFiles.map((uuid: string) => object(xcodeProject, 'PBXBuildFile', uuid).productRef)
      ).toEqual([dependencyUuid]);
    });

    it('bases every extension configuration on the React Native SwiftPM xcconfig', () => {
      for (const configuration of targetConfigurations(xcodeProject)) {
        const fileReference = object(
          xcodeProject,
          'PBXFileReference',
          configuration.baseConfigurationReference
        );
        expect(unquote(fileReference.path)).toBe('ReactNativeSPM/ReactNativeSPM.xcconfig');
      }
    });

    it('lets the extension load frameworks embedded in the app', () => {
      for (const configuration of targetConfigurations(xcodeProject)) {
        expect(configuration.buildSettings.LD_RUNPATH_SEARCH_PATHS).toEqual([
          '"$(inherited)"',
          '"@executable_path/../../Frameworks"',
        ]);
      }
    });

    it('builds ExpoModulesJSI before the extension compiles and the widgets bundle last', () => {
      expect(targetPhases(xcodeProject).map(({ name }) => name)).toEqual([
        'Build ExpoModulesJSI',
        'Sources',
        'Frameworks',
        'Build ExpoWidgets Bundle',
      ]);
    });

    it('resolves the phase scripts from the installed expo-widgets package', () => {
      const bundleScript = shellPhase(xcodeProject, 'Build ExpoWidgets Bundle').shellScript;
      const jsiScript = shellPhase(xcodeProject, 'Build ExpoModulesJSI').shellScript;
      for (const script of [bundleScript, jsiScript]) {
        expect(script).toContain("require.resolve('expo-widgets/package.json'");
        expect(script).not.toContain('node_modules');
      }
      expect(bundleScript).toContain('scripts/xcode-swiftpm-build-bundle.sh');
      expect(jsiScript).toContain('scripts/xcode-swiftpm-build-expo-modules-jsi.sh');
    });

    it('adds nothing twice when it runs again', () => {
      const before = xcodeProject.writeSync();
      applyPlugin(xcodeProject, { swiftPackageManager: true });

      expect(xcodeProject.writeSync()).toBe(before);
      expect(widgetsPackageReferences(xcodeProject)).toHaveLength(1);
      expect(widgetsProductDependencies(xcodeProject)).toHaveLength(1);
      expect(targetPhases(xcodeProject)).toHaveLength(4);
    });
  });

  it.each([
    ['is not set', undefined],
    ['is false', { swiftPackageManager: false }],
  ])('adds no SwiftPM entries when experiments.swiftPackageManager %s', (_, experiments) => {
    applyPlugin(xcodeProject, experiments);

    expect(section(xcodeProject, 'XCLocalSwiftPackageReference')).toHaveLength(0);
    expect(section(xcodeProject, 'XCSwiftPackageProductDependency')).toHaveLength(0);
    expect(widgetsTarget(xcodeProject).packageProductDependencies).toBeUndefined();
    expect(targetPhases(xcodeProject).map(({ name }) => name)).toEqual(['Sources', 'Frameworks']);
    for (const configuration of targetConfigurations(xcodeProject)) {
      expect(configuration.baseConfigurationReference).toBeUndefined();
      expect(configuration.buildSettings.LD_RUNPATH_SEARCH_PATHS).toBeUndefined();
    }
  });
});
