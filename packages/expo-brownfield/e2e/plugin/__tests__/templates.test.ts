import { setupPlugin as setupAndroidPlugin } from '../../utils/android';
import { setupPlugin as setupIosPlugin } from '../../utils/ios';
import { createTempProject, cleanUpProject, createTemplateOverrides } from '../../utils/project';
import { expectFile, expectFiles } from '../../utils/test';

let TEMP_DIR: string;

/**
 * Validates the plugin templates for Android and iOS
 */
describe('plugin templates', () => {
  beforeAll(async () => {
    TEMP_DIR = await createTempProject('plugintemplates');
  }, 600000);

  afterAll(async () => {
    await cleanUpProject('plugintemplates');
  }, 600000);

  /**
   * Expected behavior:
   * - All interpolated values are resolved in the templates for android
   */
  it('resolves all interpolated values in templates for android', async () => {
    const PACKAGE = 'com.example.test.mybrownfield';
    const GROUP = 'io.example.test';
    const VERSION = '2.56.173';
    await setupAndroidPlugin(TEMP_DIR, {
      package: PACKAGE,
      group: GROUP,
      version: VERSION,
    });

    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: [`group = "${GROUP}"`, `version = "${VERSION}"`, `namespace = "${PACKAGE}"`],
    });
    expectFiles({
      projectRoot: TEMP_DIR,
      fileNames: [
        'BrownfieldActivity.kt',
        'ReactNativeHostManager.kt',
        'ReactNativeViewFactory.kt',
        'ReactNativeFragment.kt',
      ],
      content: `package ${PACKAGE}`,
    });
  });

  /**
   * Expected behavior:
   * - All interpolated values are resolved in the templates for ios
   */
  it('resolves all interpolated values in templates for ios', async () => {
    const TARGET_NAME = 'MyBrownfield';
    const BUNDLE_IDENTIFIER = 'com.example.test.mybrownfield';
    await setupIosPlugin(TEMP_DIR, {
      targetName: TARGET_NAME,
      bundleIdentifier: BUNDLE_IDENTIFIER,
    });
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'Info.plist',
      content: [`<string>${BUNDLE_IDENTIFIER}</string>`, `<string>${TARGET_NAME}</string>`],
    });
  });

  /**
   * Expected behavior:
   * - The overriden template files are used for the android project
   */
  it('uses overriden templates for android', async () => {
    const ReactNativeHostManagerContent = '// ReactNativeHostManager.kt';
    const ReactNativeFragmentContent = '// ReactNativeFragment.kt';

    await createTemplateOverrides(TEMP_DIR, [
      { filename: 'ReactNativeHostManager.kt', content: ReactNativeHostManagerContent },
      {
        filename: 'ReactNativeFragment.kt',
        subdirectory: 'android',
        content: ReactNativeFragmentContent,
      },
    ]);
    await setupAndroidPlugin(TEMP_DIR);

    expectFiles({
      projectRoot: TEMP_DIR,
      expected: [
        { fileName: 'ReactNativeHostManager.kt', content: ReactNativeHostManagerContent },
        { fileName: 'ReactNativeFragment.kt', content: ReactNativeFragmentContent },
      ],
    });
  });

  /**
   * Expected behavior:
   * - The overriden template files are used for the ios project
   */
  it('uses overriden templates for ios', async () => {
    const ReactNativeHostManagerContent = '// ReactNativeHostManager.swift';
    const ReactNativeDelegateContent = '// ReactNativeDelegate.swift';

    await createTemplateOverrides(TEMP_DIR, [
      { filename: 'ReactNativeHostManager.swift', content: ReactNativeHostManagerContent },
      {
        filename: 'ReactNativeDelegate.swift',
        subdirectory: 'ios',
        content: ReactNativeDelegateContent,
      },
    ]);
    await setupIosPlugin(TEMP_DIR);

    expectFiles({
      projectRoot: TEMP_DIR,
      expected: [
        { fileName: 'ReactNativeHostManager.swift', content: ReactNativeHostManagerContent },
        { fileName: 'ReactNativeDelegate.swift', content: ReactNativeDelegateContent },
      ],
    });
  });

  /**
   * Expected behavior:
   * - The overriden template files are resolved from the root of the directory first,
   *   then from the platform specific subdirectory
   */
  it('first resolves templates from the root of the directory', async () => {
    const ReactNativeHostManagerContent1 = '// ReactNativeHostManager.swift [1]';
    const ReactNativeHostManagerContent2 = '// ReactNativeHostManager.swift [2]';

    await createTemplateOverrides(TEMP_DIR, [
      { filename: 'ReactNativeHostManager.swift', content: ReactNativeHostManagerContent1 },
      {
        filename: 'ReactNativeHostManager.swift',
        subdirectory: 'ios',
        content: ReactNativeHostManagerContent2,
      },
    ]);
    await setupIosPlugin(TEMP_DIR);

    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'ReactNativeHostManager.swift',
      content: ReactNativeHostManagerContent1,
    });
  });

  /**
   * Expected behavior:
   * - The interpolated values are resolved in the overriden templates
   */
  it('resolves interpolated values in custom templates', async () => {
    const BuildGradleContent = 'version = "${{version}}"';

    await createTemplateOverrides(TEMP_DIR, [
      {
        filename: 'build.gradle.kts',
        subdirectory: 'android',
        content: BuildGradleContent,
      },
    ]);
    await setupAndroidPlugin(TEMP_DIR);
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: 'version = "1.0.0"',
    });
  });
});
