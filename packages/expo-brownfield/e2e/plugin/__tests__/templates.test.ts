import { applyPatch } from 'diff';
import fs from 'node:fs';
import path from 'node:path';

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
   * - The dev-menu patches apply cleanly to the current templates. The patches
   *   encode template lines as context, so any template edit that isn't
   *   mirrored in the patch breaks prebuild for every expo-dev-menu user —
   *   but only projects that actually depend on expo-dev-menu hit it, which
   *   the temp projects here don't. Guard it directly.
   */
  it('applies the dev-menu patches cleanly to the current templates', () => {
    const templatesDir = path.join(__dirname, '../../../plugin/templates');
    const interpolate = (contents: string) =>
      contents.replace(/\$\{\{[A-Za-z0-9]+\}\}/g, 'com.example.app');

    const pairs = [
      ['android/BrownfieldActivity.kt', 'patches/BrownfieldActivity.patch'],
      ['android/ReactNativeHostManager.kt', 'patches/ReactNativeHostManager.patch'],
    ];
    for (const [template, patch] of pairs) {
      const templateContents = interpolate(
        fs.readFileSync(path.join(templatesDir, template), 'utf8')
      );
      const patchContents = fs.readFileSync(path.join(templatesDir, patch), 'utf8');
      const result = applyPatch(templateContents, patchContents);
      if (result === false) {
        throw new Error(`${patch} no longer applies to ${template} — update the patch context`);
      }
    }
  });

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
      filePath: 'android/brownfield/build.gradle.kts',
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
   * - Both fused sibling subprojects are emitted, one per variant, with
   *   interpolated values resolved and the inert-by-default property guard
   * - settings.gradle includes the fused siblings
   * - gradle.properties contains the Fused Library preview opt-ins
   * - The root build.gradle contains the conditional AGP force-bump
   */
  it('emits inert fused sibling projects for android', async () => {
    const PACKAGE = 'com.example.test.mybrownfield';
    const GROUP = 'io.example.test';
    const VERSION = '2.56.173';
    await setupAndroidPlugin(TEMP_DIR, {
      package: PACKAGE,
      group: GROUP,
      version: VERSION,
    });

    for (const variant of ['release', 'debug']) {
      expectFile({
        projectRoot: TEMP_DIR,
        filePath: `android/brownfield-fused-${variant}/build.gradle.kts`,
        content: [
          `group = "${GROUP}"`,
          `version = "${VERSION}"`,
          `namespace = "${PACKAGE}.fused.${variant}"`,
          `val fusedVariant = "${variant}"`,
          // Inert unless the CLI passes -Pbrownfield.fused=true — a plain
          // `expo run:android` must not resolve the fused dependency graph
          `findProperty("brownfield.fused") == "true"`,
        ],
      });
    }

    expectFile({
      projectRoot: TEMP_DIR,
      filePath: 'android/settings.gradle',
      content: [
        `include ':brownfield'`,
        `include ':brownfield-fused-release'`,
        `include ':brownfield-fused-debug'`,
      ],
    });
    expectFile({
      projectRoot: TEMP_DIR,
      filePath: 'android/gradle.properties',
      content: [
        'android.experimental.fusedLibrarySupport=true',
        'android.experimental.fusedLibrarySupport.publicationOnly=false',
      ],
    });
    expectFile({
      projectRoot: TEMP_DIR,
      filePath: 'android/build.gradle',
      content: [`findProperty('brownfield.fused') == 'true'`, 'com.android.tools.build:gradle'],
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
   * - The overridden template files are used for the android project
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
   * - The overridden template files are used for the ios project
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
   * - The overridden template files are resolved from the root of the directory first,
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
   * - The interpolated values are resolved in the overridden templates
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
