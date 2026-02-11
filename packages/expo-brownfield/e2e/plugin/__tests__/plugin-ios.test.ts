import {
  setupPlugin,
  validatePodfile,
  validateBuildProperties,
  validatePodfileProperties,
  validateBrownfieldGroup,
  validateBrownfieldFiles,
  validateAppDelegatePatch,
  validateBuildPhases,
  validateBundleIdentifier,
  validateBuildSettings,
} from '../../utils/ios';
import { createTempProject, cleanUpProject, projectName } from '../../utils/project';

let TEMP_DIR: string;
const PROJECT_SUFFIX = 'pluginios';

/**
 * Validates the plugin behavior for iOS
 */
describe('plugin for ios', () => {
  beforeAll(async () => {
    TEMP_DIR = await createTempProject(PROJECT_SUFFIX);
    await setupPlugin(TEMP_DIR);
  }, 600000);

  afterAll(async () => {
    await cleanUpProject(PROJECT_SUFFIX);
  }, 600000);

  /**
   * Expected behavior:
   * - Podfile properties includes: "ios.buildReactNativeFromSource" = "true"
   *   added via build properties plugin
   */
  it('modifies the build properties', async () => {
    validateBuildProperties(TEMP_DIR);
  });

  /**
   * Expected behavior:
   * - Podfile includes the custom script
   *   added via podfile plugin
   * - Podfile includes the additional target for brownfield
   *   added via podfile plugin
   */
  it('modifies the podfile', async () => {
    validatePodfile(TEMP_DIR, 'testapppluginiosbrownfield');
  });

  /**
   * Expected behavior:
   * - Podfile properties includes: "ios.useFrameworks" = "static"
   *   added via podfile properties plugin
   * - Podfile properties includes: "ios.brownfieldTargetName" = "<targetName>"
   *   added via podfile properties plugin
   */
  it('modifies the podfile properties', async () => {
    validatePodfileProperties(TEMP_DIR, {
      'ios.useFrameworks': 'static',
      'ios.brownfieldTargetName': 'testapppluginiosbrownfield',
    });
  });

  /**
   * Expected behavior:
   * - A group is created for the brownfield framework
   * - The group should be properly included in the Xcode project
   */
  it('should create a group for the brownfield framework', async () => {
    validateBrownfieldGroup(TEMP_DIR, 'testapppluginiosbrownfield', projectName(PROJECT_SUFFIX));
  });

  /**
   * Expected behavior:
   * - All brownfield files are created
   * - The files are properly included in the Xcode project
   * - The files are correctly included in the sources build phase
   */
  it('should create all brownfield files', async () => {
    const files = [
      'ExpoAppDelegate.swift',
      'Info.plist',
      'Messaging.swift',
      'ReactNativeDelegate.swift',
      'ReactNativeHostManager.swift',
      'ReactNativeView.swift',
      'ReactNativeViewController.swift',
      'testapppluginiosbrownfield.entitlements',
    ];
    validateBrownfieldFiles(
      TEMP_DIR,
      'testapppluginiosbrownfield',
      files,
      projectName(PROJECT_SUFFIX)
    );
  });

  /**
   * Expected behavior:
   * - The app delegate is patched to import Expo with `internal`
   */
  it('should patch the app delegate', async () => {
    validateAppDelegatePatch(TEMP_DIR, 'testapppluginiosbrownfield');
  });

  /**
   * Expected behavior:
   * - The build phases are configured correctly:
   *   - Patching ExpoModulesProvider
   *   - Referencing app project's bundle phase
   */
  it('should configure the build phases', async () => {
    validateBuildPhases(TEMP_DIR, 'testapppluginiosbrownfield', projectName(PROJECT_SUFFIX));
  });

  /**
   * Expected behavior:
   * - The build settings are properly set up for the brownfield target
   */
  it('should properly set up build settings', async () => {
    validateBuildSettings(TEMP_DIR, 'testapppluginiosbrownfield', projectName(PROJECT_SUFFIX));
  });

  /**
   * Expected behavior:
   * - The default values are properly inferred:
   *   - Target name
   *   - Bundle identifier
   */
  it('should properly infer values if no props are passed', async () => {
    validateBrownfieldGroup(TEMP_DIR, 'testapppluginiosbrownfield', projectName(PROJECT_SUFFIX));
    validateBundleIdentifier(
      TEMP_DIR,
      new RegExp('[a-zA-Z0-9-]+\\.testapppluginiosbrownfield'),
      'testapppluginiosbrownfield'
    );
  });

  /**
   * Expected behavior:
   * - Target name is properly handled
   */
  it('should properly handle target name plugin prop', async () => {
    const TARGET_NAME = 'MyBrownfield';
    await setupPlugin(TEMP_DIR, { targetName: TARGET_NAME });

    validateBrownfieldGroup(TEMP_DIR, TARGET_NAME, projectName(PROJECT_SUFFIX));
    validateBundleIdentifier(TEMP_DIR, new RegExp(`[a-zA-Z0-9-]+\\.${TARGET_NAME}`), TARGET_NAME);
  });

  /**
   * Expected behavior:
   * - Bundle identifier is properly handled
   */
  it('should properly handle bundle identifier plugin prop', async () => {
    const BUNDLE_IDENTIFIER = 'com.example.test.myapp.testapppluginiosbrownfield';
    await setupPlugin(TEMP_DIR, {
      bundleIdentifier: BUNDLE_IDENTIFIER,
    });

    validateBundleIdentifier(TEMP_DIR, BUNDLE_IDENTIFIER, 'testapppluginiosbrownfield');
  });
});
