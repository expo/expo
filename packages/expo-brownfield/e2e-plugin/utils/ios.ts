import {
  parse,
  PBXBuildFile,
  PBXFileReference,
  PBXNativeTarget,
  PBXShellScriptBuildPhase,
  PBXSourcesBuildPhase,
  XCBuildConfiguration,
  XCConfigurationList,
} from '@bacons/xcode/json';
import fs from 'fs';
import path from 'path';

// SECTION: Validation functions

/**
 * Validates that build properties are properly set
 */
export const validateBuildProperties = (projectRoot: string) => {
  validatePodfileProperty(projectRoot, 'ios.buildReactNativeFromSource', 'true');
};

/**
 * Validates that the podfile is modified
 */
export const validatePodfile = async (projectRoot: string, targetName: string) => {
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  expect(fs.existsSync(podfilePath)).toBe(true);

  const podfileContent = fs.readFileSync(podfilePath, 'utf8');
  const podfileRegex = new RegExp(`\\s*target '${targetName}' do\n\\s*inherit! :complete\n\\s*end`);
  expect(podfileContent).toMatch(podfileRegex);
};

/**
 * Validates that the podfile properties are properly set
 */
export const validatePodfileProperties = (
  projectRoot: string,
  expectedProperties: Record<string, string>
) => {
  Object.keys(expectedProperties).forEach((key) =>
    validatePodfileProperty(projectRoot, key, expectedProperties[key])
  );
};

/**
 * Validates that a group is created for the brownfield framework
 */
export const validateBrownfieldGroup = (projectRoot: string, targetName: string) => {
  const pbxproj = parsePbxproj(projectRoot);

  const groupPath = path.join(projectRoot, 'ios', targetName);
  expect(fs.existsSync(groupPath)).toBe(true);

  const group = Object.keys(pbxproj.objects).find(
    (key) =>
      pbxproj.objects[key].isa === 'PBXGroup' &&
      'name' in pbxproj.objects[key] &&
      pbxproj.objects[key].name === targetName
  );
  expect(group).toBeDefined();
};

/**
 * Validates that all brownfield files are created
 */
export const validateBrownfieldFiles = (
  projectRoot: string,
  targetName: string,
  files: string[]
) => {
  const frameworkPath = path.join(projectRoot, 'ios', targetName);
  expect(fs.existsSync(frameworkPath)).toBe(true);

  const directoryFiles = fs.readdirSync(frameworkPath);
  expect(files.every((file) => directoryFiles.includes(file))).toBe(true);

  const pbxproj = parsePbxproj(projectRoot);

  const buildPhases = getBuildPhases(projectRoot, targetName);
  const sourcesBuildPhase = buildPhases.find(
    (phase) => phase in pbxproj.objects && pbxproj.objects[phase].isa === 'PBXSourcesBuildPhase'
  );
  expect(sourcesBuildPhase).toBeDefined();

  const sourceFiles = (pbxproj.objects[sourcesBuildPhase] as PBXSourcesBuildPhase).files.map(
    (file) => {
      const fileObj = Object.keys(pbxproj.objects).find(
        (key) => key === file && pbxproj.objects[key].isa === 'PBXBuildFile'
      );
      expect(fileObj).toBeDefined();

      const fileReference = Object.keys(pbxproj.objects).find(
        (key) => key === (pbxproj.objects[fileObj] as PBXBuildFile).fileRef
      );
      expect(fileReference).toBeDefined();

      return pbxproj.objects[fileReference] as PBXFileReference;
    }
  );

  files
    .filter((file) => file.endsWith('.swift'))
    .forEach((file) => {
      const sourceFile = sourceFiles.find((entry) => entry.name === file);
      expect(sourceFile).toBeDefined();
    });
};

/**
 * Validates that the app delegate is patched
 */
export const validateAppDelegatePatch = (
  projectRoot: string,
  targetName: string,
  appDelegateFileName: string = 'ExpoAppDelegate.swift'
) => {
  const appDelegatePath = path.join(projectRoot, 'ios', targetName, appDelegateFileName);
  expect(fs.existsSync(appDelegatePath)).toBe(true);

  const appDelegateContent = fs.readFileSync(appDelegatePath, 'utf8');
  const classNameRegex = new RegExp(
    `@objc\nopen class ExpoBrownfieldAppDelegate: UIResponder, UIApplicationDelegate`
  );
  expect(appDelegateContent).toMatch(classNameRegex);

  const correctImportRegex = new RegExp(`internal import ExpoModulesCore`);
  expect(appDelegateContent).toMatch(correctImportRegex);
};

/**
 * Validates that the build phases are properly set
 */
export const validateBuildPhases = (projectRoot: string, targetName: string) => {
  const pbxproj = parsePbxproj(projectRoot);
  const buildPhases = getBuildPhases(projectRoot, targetName);

  const bundlePhase = buildPhases.find(
    (phase) =>
      phase in pbxproj.objects &&
      pbxproj.objects[phase].isa === 'PBXShellScriptBuildPhase' &&
      (pbxproj.objects[phase] as PBXShellScriptBuildPhase).name ===
        'Bundle React Native code and images'
  );
  expect(bundlePhase).toBeDefined();
};

/**
 * Validates that the build settings are properly set
 */
export const validateBuildSettings = (projectRoot: string, targetName: string) => {
  const pbxproj = parsePbxproj(projectRoot);

  const frameworkTarget = Object.keys(pbxproj.objects).find(
    (key) =>
      pbxproj.objects[key].isa === 'PBXNativeTarget' &&
      'name' in pbxproj.objects[key] &&
      pbxproj.objects[key].name === targetName
  );
  expect(frameworkTarget).toBeDefined();

  const buildConfigurationListKey = (pbxproj.objects[frameworkTarget] as PBXNativeTarget)
    .buildConfigurationList;
  const buildConfigurationList = pbxproj.objects[buildConfigurationListKey];
  expect(buildConfigurationList).toBeDefined();

  const buildConfigurations = (buildConfigurationList as XCConfigurationList).buildConfigurations;
  expect(buildConfigurations.length).toBe(2);

  buildConfigurations.forEach((buildConfigurationKey) => {
    const buildConfigurationObj = pbxproj.objects[buildConfigurationKey] as XCBuildConfiguration;
    expect(buildConfigurationObj).toBeDefined();

    expect(buildConfigurationObj.isa).toBe('XCBuildConfiguration');
    expect(['Debug', 'Release']).toContain(buildConfigurationObj.name);

    expect(buildConfigurationObj.buildSettings).toBeDefined();
    expect(buildConfigurationObj.buildSettings['BUILD_LIBRARY_FOR_DISTRIBUTION']).toBe('YES');
    expect(buildConfigurationObj.buildSettings['ENABLE_MODULE_VERIFIER']).toBe('NO');
    expect(buildConfigurationObj.buildSettings['SKIP_INSTALL']).toBe('NO');
    expect(buildConfigurationObj.buildSettings['USER_SCRIPT_SANDBOXING']).toBe('NO');
  });
};

// END SECTION: Validation functions

// SECTION: Helper functions

/**
 * Validates that a specific podfile property is properly set
 */
const validatePodfileProperty = (projectRoot: string, key: string, value: string) => {
  const podfilePropertiesPath = path.join(projectRoot, 'ios', 'Podfile.properties.json');
  expect(fs.existsSync(podfilePropertiesPath)).toBe(true);

  const podfileProperties = JSON.parse(fs.readFileSync(podfilePropertiesPath, 'utf8'));
  expect(podfileProperties[key]).toBe(value);
};

/**
 * Gets the build phases for a given target name
 */
const getBuildPhases = (projectRoot: string, targetName: string) => {
  const pbxproj = parsePbxproj(projectRoot);

  const frameworkTarget = Object.keys(pbxproj.objects).find(
    (key) =>
      pbxproj.objects[key].isa === 'PBXNativeTarget' &&
      'name' in pbxproj.objects[key] &&
      pbxproj.objects[key].name === targetName
  );
  expect(frameworkTarget).toBeDefined();

  const buildPhases = (pbxproj.objects[frameworkTarget] as PBXNativeTarget).buildPhases;
  expect(buildPhases.length).toBeGreaterThan(0);

  return buildPhases;
};

/**
 * Validates that the bundle identifier is properly set
 */
export const validateBundleIdentifier = (
  projectRoot: string,
  expected: string | RegExp,
  targetName: string
) => {
  const infoPlistPath = path.join(projectRoot, 'ios', targetName, 'Info.plist');
  expect(fs.existsSync(infoPlistPath)).toBe(true);

  const infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');
  if (typeof expected === 'string') {
    const regex = new RegExp(`<key>CFBundleIdentifier</key>\n\\s*<string>${expected}</string>`);
    expect(infoPlistContent).toMatch(regex);
  } else {
    expect(infoPlistContent).toMatch(expected);
  }
};

/**
 * Parses the pbxproj file
 */
export const parsePbxproj = (projectRoot: string) => {
  const pbxprojPath = path.join(
    projectRoot,
    'ios',
    `testapppluginios.xcodeproj`,
    'project.pbxproj'
  );
  const pbxproj = parse(fs.readFileSync(pbxprojPath, 'utf8'));
  return pbxproj;
};

// END SECTION: Helper functions
