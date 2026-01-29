import {
  createTempProject,
  cleanUpProject,
  prebuildProject,
  addPlugin,
  createTemplateOverrides,
} from '../../utils/project';
import { expectFile } from '../../utils/test';

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
    await addPlugin(TEMP_DIR, {
      android: {
        package: 'com.example.test.mybrownfield',
        group: 'io.example.test',
        version: '2.56.173',
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: [
        'group = "io.example.test"',
        'version = "2.56.173"',
        'namespace = "com.example.test.mybrownfield"',
      ],
    });
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'BrownfieldActivity.kt',
      content: ['package com.example.test.mybrownfield'],
    });
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'ReactNativeHostManager.kt',
      content: ['package com.example.test.mybrownfield'],
    });
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'ReactNativeViewFactory.kt',
      content: ['package com.example.test.mybrownfield'],
    });
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'ReactNativeFragment.kt',
      content: ['package com.example.test.mybrownfield'],
    });
  });

  /**
   * Expected behavior:
   * - All interpolated values are resolved in the templates for ios
   */
  it('resolves all interpolated values in templates for ios', async () => {
    await addPlugin(TEMP_DIR, {
      ios: {
        targetName: 'MyBrownfield',
        bundleIdentifier: 'com.example.test.mybrownfield',
      },
    });
    await prebuildProject(TEMP_DIR, 'ios');
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'Info.plist',
      content: ['<string>com.example.test.mybrownfield</string>', '<string>MyBrownfield</string>'],
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
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'android');

    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'ReactNativeHostManager.kt',
      content: [ReactNativeHostManagerContent],
    });
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'ReactNativeFragment.kt',
      content: [ReactNativeFragmentContent],
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
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');

    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'ReactNativeHostManager.swift',
      content: [ReactNativeHostManagerContent],
    });
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'ReactNativeDelegate.swift',
      content: [ReactNativeDelegateContent],
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
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'ios');

    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'ReactNativeHostManager.swift',
      content: [ReactNativeHostManagerContent1],
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
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'android');
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: ['version = "1.0.0"'],
    });
  });
});
