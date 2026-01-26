import {
  validatePodfile,
  validateBuildProperties,
  validatePodfileProperties,
  validateBrownfieldGroup,
  validateBrownfieldFiles,
  validateAppDelegatePatch,
  validateBuildPhases,
  validateBundleIdentifier,
  validateBuildSettings,
} from '../utils/ios';
import { createTempProject, cleanUpProject, prebuildProject, addPlugin } from '../utils/project';

let TEMP_DIR: string;

/**
 * Validates the plugin behavior for iOS
 */
describe('plugin for ios', () => {
  beforeAll(async () => {
    TEMP_DIR = await createTempProject('pluginios');
  }, 600000);

  afterAll(async () => {
    await cleanUpProject('pluginios');
  }, 600000);

  /**
   * Expected behavior:
   * - Podfile properties includes: "ios.buildReactNativeFromSource" = "true"
   *   added via build properties plugin
   */
  it('modifies the build properties', async () => {
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');
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
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');
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
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');
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
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');
    validateBrownfieldGroup(TEMP_DIR, 'testapppluginiosbrownfield');
  });

  /**
   * Expected behavior:
   * - All brownfield files are created
   * - The files are properly included in the Xcode project
   * - The files are correctly included in the sources build phase
   */
  it('should create all brownfield files', async () => {
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');

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

    validateBrownfieldFiles(TEMP_DIR, 'testapppluginiosbrownfield', files);
  });

  /**
   * Expected behavior:
   * - The app delegate is patched to import Expo with `internal`
   */
  it('should patch the app delegate', async () => {
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');
    validateAppDelegatePatch(TEMP_DIR, 'testapppluginiosbrownfield');
  });

  /**
   * Expected behavior:
   * - The build phases are configured correctly:
   *   - Patching ExpoModulesProvider
   *   - Referencing app project's bundle phase
   */
  it('should configure the build phases', async () => {
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');
    validateBuildPhases(TEMP_DIR, 'testapppluginiosbrownfield');
  });

  /**
   * Expected behavior:
   * - The build settings are properly set up for the brownfield target
   */
  it('should properly set up build settings', async () => {
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');
    validateBuildSettings(TEMP_DIR, 'testapppluginiosbrownfield');
  });

  /**
   * Expected behavior:
   * - The default values are properly inferred:
   *   - Target name
   *   - Bundle identifier
   */
  it('should properly infer values if no props are passed', async () => {
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');
    validateBrownfieldGroup(TEMP_DIR, 'testapppluginiosbrownfield');
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
    await addPlugin(TEMP_DIR, { ios: { targetName: 'MyBrownfield' } });
    await prebuildProject(TEMP_DIR, 'ios');
    validateBrownfieldGroup(TEMP_DIR, 'MyBrownfield');
    validateBundleIdentifier(TEMP_DIR, new RegExp('[a-zA-Z0-9-]+\\.MyBrownfield'), 'MyBrownfield');
  });

  /**
   * Expected behavior:
   * - Bundle identifier is properly handled
   */
  it('should properly handle bundle identifier plugin prop', async () => {
    await addPlugin(TEMP_DIR, {
      ios: { bundleIdentifier: 'com.example.test.myapp.testapppluginiosbrownfield' },
    });
    await prebuildProject(TEMP_DIR, 'ios');
    validateBundleIdentifier(
      TEMP_DIR,
      'com.example.test.myapp.testapppluginiosbrownfield',
      'testapppluginiosbrownfield'
    );
  });
});
