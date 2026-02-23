import {
  validateBrownfieldLibrary,
  validateBrownfieldFiles,
  validateSettingsGradle,
  validateBuildGradle,
  setupPlugin,
  getAndroidPaths,
  getPublishingLines,
} from '../../utils/android';
import { createTempProject, cleanUpProject } from '../../utils/project';
import { expectFile, expectFiles } from '../../utils/test';
import { PluginProps } from '../../utils/types';

let TEMP_DIR: string;

/**
 * Validates the plugin behavior for Android
 */
describe('plugin for android', () => {
  beforeAll(async () => {
    TEMP_DIR = await createTempProject('pluginandroid');
    await setupPlugin(TEMP_DIR);
  }, 600000);

  afterAll(async () => {
    await cleanUpProject('pluginandroid');
  }, 600000);

  /**
   * Expected behavior:
   * - The brownfield library is created
   */
  it('should create the brownfield library', async () => {
    validateBrownfieldLibrary(TEMP_DIR);
  });

  /**
   * Expected behavior:
   * - settings.gradle includes the brownfield library
   * - settings.gradle includes the brownfield gradle plugins
   */
  it('modifies settings.gradle', async () => {
    validateSettingsGradle(TEMP_DIR);
  });

  /**
   * Expected behavior:
   * - build.gradle includes the brownfield publish plugin
   * - the plugin is configured correctly with the correct library name
   *   and publishing (repositories) configuration
   */
  it('modifies build.gradle', async () => {
    validateBuildGradle(TEMP_DIR, getPublishingLines(TEMP_DIR, [{ type: 'localMaven' }]));
  });

  /**
   * Expected behavior:
   * - All brownfield files are created
   */
  it('should create all brownfield files', async () => {
    const PACKAGE = 'com.example.test.brownfield';
    await setupPlugin(TEMP_DIR, {
      package: PACKAGE,
    });

    const { sourcesPath, packagePath } = getAndroidPaths(PACKAGE);
    const files = [
      'build.gradle.kts',
      'consumer-rules.pro',
      'proguard-rules.pro',
      `${sourcesPath}/AndroidManifest.xml`,
      `${packagePath}/BrownfieldActivity.kt`,
      `${packagePath}/ReactNativeHostManager.kt`,
      `${packagePath}/ReactNativeViewFactory.kt`,
      `${packagePath}/ReactNativeFragment.kt`,
    ];

    validateBrownfieldFiles(TEMP_DIR, files);
  });

  /**
   * Expected behavior:
   * - The default values are properly inferred:
   *   - Library name
   *   - Package identifier
   *   - Group
   *   - Version
   *   - Publishing configuration
   */
  it('should properly infer values if no props are passed', async () => {
    const PACKAGE = 'com.example.test.app';
    await setupPlugin(TEMP_DIR, undefined, { package: PACKAGE });
    validateBrownfieldLibrary(TEMP_DIR);

    const { packagePath } = getAndroidPaths(PACKAGE + '.brownfield');
    const files = [
      `${packagePath}/ReactNativeHostManager.kt`,
      `${packagePath}/ReactNativeFragment.kt`,
    ];
    validateBrownfieldFiles(TEMP_DIR, files);
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: ['group = "com.example.test.app"', 'version = "1.0.0"'],
    });

    const publishingLines = ['localDefault {', 'type.set("localMaven")'];
    validateBuildGradle(TEMP_DIR, publishingLines);
  });

  /**
   * Expected behavior:
   * - The library name is properly handled
   */
  it('should properly handle library name plugin prop', async () => {
    const LIBRARY_NAME = 'mybrownfield';
    await setupPlugin(TEMP_DIR, {
      libraryName: LIBRARY_NAME,
    });

    const files = ['build.gradle.kts', 'consumer-rules.pro', 'proguard-rules.pro'];
    validateBrownfieldFiles(TEMP_DIR, files, LIBRARY_NAME);
  });

  /**
   * Expected behavior:
   * - The package identifier is properly handled
   */
  it('should properly handle package identifier plugin prop', async () => {
    const PACKAGE = 'com.example.test.mybrownfield';
    await setupPlugin(TEMP_DIR, {
      package: PACKAGE,
    });

    const { packagePath } = getAndroidPaths(PACKAGE);
    const files = [
      `${packagePath}/ReactNativeHostManager.kt`,
      `${packagePath}/ReactNativeFragment.kt`,
    ];
    validateBrownfieldFiles(TEMP_DIR, files);
    expectFiles({
      projectRoot: TEMP_DIR,
      fileNames: ['ReactNativeHostManager.kt', 'ReactNativeViewFactory.kt'],
      content: 'package com.example.test.mybrownfield',
    });
  });

  /**
   * Expected behavior:
   * - The group is properly handled
   */
  it('should properly handle group plugin prop', async () => {
    const GROUP = 'com.example.test';
    await setupPlugin(TEMP_DIR, {
      group: GROUP,
    });

    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: [`group = "${GROUP}"`],
    });
  });

  /**
   * Expected behavior:
   * - The version is properly handled
   */
  it('should properly handle version plugin prop', async () => {
    const VERSION = '1.2.345';
    await setupPlugin(TEMP_DIR, {
      version: VERSION,
    });

    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: [`version = "${VERSION}"`],
    });
  });

  /**
   * Expected behavior:
   * - The publishing configuration is properly handled
   */
  it('should properly handle publishing configuration plugin prop', async () => {
    const PUBLISHING = [
      {
        type: 'localMaven',
      },
      {
        type: 'localDirectory',
        path: './local-maven-repo',
      },
      {
        type: 'remotePublic',
        url: 'https://example.com/repository',
      },
      {
        type: 'remotePrivate',
        url: 'https://example.com/private-repository',
        username: 'myusername',
        password: 'mypassword',
      },
    ] as PluginProps['android']['publishing'];
    await setupPlugin(TEMP_DIR, {
      publishing: PUBLISHING,
    });

    validateBuildGradle(TEMP_DIR, getPublishingLines(TEMP_DIR, PUBLISHING));
  });

  /**
   * Expected behavior:
   * - Multiple repositories of the same type are properly handled
   *   by prefixing publication names with numbers
   */
  it('should properly handle multiple repos of the same type', async () => {
    const PUBLISHING = [
      {
        type: 'localMaven',
      },
      {
        type: 'localMaven',
      },
      {
        type: 'localDirectory',
        path: './local-maven-repo',
      },
      {
        type: 'localDirectory',
        path: './local-maven-repo-2',
      },
    ] as PluginProps['android']['publishing'];
    await setupPlugin(TEMP_DIR, {
      publishing: PUBLISHING,
    });

    validateBuildGradle(TEMP_DIR, getPublishingLines(TEMP_DIR, PUBLISHING));
  });

  /**
   * Expected behavior:
   * - Multiple repositories of the same type with different names are properly handled
   */
  it('should properly handle multiple repos of the same type with different names', async () => {
    const PUBLISHING = [
      {
        type: 'localMaven',
      },
      {
        type: 'localMaven',
      },
      {
        type: 'localDirectory',
        name: 'localMavenRepo',
        path: './local-maven-repo',
      },
      {
        type: 'localDirectory',
        name: 'localMavenRepo256',
        path: './local-maven-repo-2',
      },
    ] as PluginProps['android']['publishing'];
    await setupPlugin(TEMP_DIR, {
      publishing: PUBLISHING,
    });

    validateBuildGradle(TEMP_DIR, getPublishingLines(TEMP_DIR, PUBLISHING));
  });

  /**
   * Expected behavior:
   * - The path is properly resolved for localDirectory repositories
   */
  it('should properly resolve paths for localDirectory repositories', async () => {
    const PUBLISHING = [
      {
        type: 'localDirectory',
        path: './local-maven-repo',
      },
      {
        type: 'localDirectory',
        path: '/tmp/local-maven-repo-home',
      },
    ] as PluginProps['android']['publishing'];
    await setupPlugin(TEMP_DIR, {
      publishing: PUBLISHING,
    });

    validateBuildGradle(TEMP_DIR, getPublishingLines(TEMP_DIR, PUBLISHING));
  });

  /**
   * Expected behavior:
   * - Environment variables are properly handled in repository configuration
   */
  it('should properly handle environment variables in repository configuration', async () => {
    const ENV = {
      MAVEN_PUBLISHING_URL: 'https://example.com/secret-repository',
      MAVEN_PUBLISHING_USERNAME: 'secretusername1234',
      MAVEN_PUBLISHING_PASSWORD: 'secretpassword1234',
    };
    const PUBLISHING = [
      {
        type: 'remotePrivate',
        url: {
          variable: 'MAVEN_PUBLISHING_URL',
        },
        username: {
          variable: 'MAVEN_PUBLISHING_USERNAME',
        },
        password: {
          variable: 'MAVEN_PUBLISHING_PASSWORD',
        },
      },
    ] as PluginProps['android']['publishing'];
    await setupPlugin(TEMP_DIR, {
      publishing: PUBLISHING,
    });

    validateBuildGradle(TEMP_DIR, getPublishingLines(TEMP_DIR, PUBLISHING));
  });

  /**
   * Expected behavior:
   * - The allowInsecure option is properly handled
   */
  it('should properly handle allowInsecure option for repositories', async () => {
    const PUBLISHING = [
      {
        type: 'remotePublic',
        url: 'http://example.com/public-repository',
        allowInsecure: true,
      },
    ] as PluginProps['android']['publishing'];
    await setupPlugin(TEMP_DIR, {
      publishing: PUBLISHING,
    });

    validateBuildGradle(TEMP_DIR, getPublishingLines(TEMP_DIR, PUBLISHING));
  });
});
