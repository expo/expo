import {
  validateBrownfieldLibrary,
  validateBrownfieldFiles,
  validateSettingsGradle,
  validateBuildGradle,
} from '../utils/android';
import {
  createTempProject,
  cleanUpProject,
  prebuildProject,
  addPlugin,
  createEnvFile,
} from '../utils/project';
import { expectFile } from '../utils/test';

let TEMP_DIR: string;

/**
 * Validates the plugin behavior for Android
 */
describe('plugin for android', () => {
  beforeAll(async () => {
    TEMP_DIR = await createTempProject('pluginandroid');
  }, 600000);

  afterAll(async () => {
    await cleanUpProject('pluginandroid');
  }, 600000);

  /**
   * Expected behavior:
   * - The brownfield library is created
   */
  it('should create the brownfield library', async () => {
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'android');
    validateBrownfieldLibrary(TEMP_DIR);
  });

  /**
   * Expected behavior:
   * - All brownfield files are created
   */
  it('should create all brownfield files', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        package: 'com.example.test.brownfield',
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    const SOURCES_PATH = 'src/main';
    const PACKAGE_PATH = `${SOURCES_PATH}/java/com/example/test/brownfield`;

    const files = [
      'build.gradle.kts',
      'consumer-rules.pro',
      'proguard-rules.pro',
      `${SOURCES_PATH}/AndroidManifest.xml`,
      `${PACKAGE_PATH}/BrownfieldActivity.kt`,
      `${PACKAGE_PATH}/ReactNativeHostManager.kt`,
      `${PACKAGE_PATH}/ReactNativeViewFactory.kt`,
      `${PACKAGE_PATH}/ReactNativeFragment.kt`,
    ];

    validateBrownfieldFiles(TEMP_DIR, files);
  });

  /**
   * Expected behavior:
   * - settings.gradle includes the brownfield library
   * - settings.gradle includes the brownfield gradle plugins
   */
  it('modifies settings.gradle', async () => {
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'android');
    validateSettingsGradle(TEMP_DIR);
  });

  /**
   * Expected behavior:
   * - build.gradle includes the brownfield publish plugin
   * - the plugin is configured correctly with the correct library name
   *   and publishing (repositories) configuration
   */
  it('modifies build.gradle', async () => {
    await addPlugin(TEMP_DIR);
    await prebuildProject(TEMP_DIR, 'android');

    const publishingLines = ['localDefault {', 'type = "localMaven"'];
    validateBuildGradle(TEMP_DIR, publishingLines);
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
    await addPlugin(TEMP_DIR, {}, { package: 'com.example.test.app' });
    await prebuildProject(TEMP_DIR, 'android');

    validateBrownfieldLibrary(TEMP_DIR);
    const PACKAGE_PATH = `src/main/java/com/example/test/app/brownfield`;
    const files = [
      `${PACKAGE_PATH}/ReactNativeHostManager.kt`,
      `${PACKAGE_PATH}/ReactNativeFragment.kt`,
    ];
    validateBrownfieldFiles(TEMP_DIR, files);
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: ['group = "com.example.test.app"'],
    });
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: ['version = "1.0.0"'],
    });
    const publishingLines = ['localDefault {', 'type = "localMaven"'];
    validateBuildGradle(TEMP_DIR, publishingLines);
  });

  /**
   * Expected behavior:
   * - The library name is properly handled
   */
  it('should properly handle library name plugin prop', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        libraryName: 'mybrownfield',
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    const files = ['build.gradle.kts', 'consumer-rules.pro', 'proguard-rules.pro'];
    validateBrownfieldFiles(TEMP_DIR, files, 'mybrownfield');
  });

  /**
   * Expected behavior:
   * - The package identifier is properly handled
   */
  it('should properly handle package identifier plugin prop', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        package: 'com.example.test.mybrownfield',
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    const PACKAGE_PATH = `src/main/java/com/example/test/mybrownfield`;
    const files = [
      `${PACKAGE_PATH}/ReactNativeHostManager.kt`,
      `${PACKAGE_PATH}/ReactNativeFragment.kt`,
    ];
    validateBrownfieldFiles(TEMP_DIR, files);

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
  });

  /**
   * Expected behavior:
   * - The group is properly handled
   */
  it('should properly handle group plugin prop', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        group: 'com.example.test',
      },
    });
    await prebuildProject(TEMP_DIR, 'android');
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: ['group = "com.example.test"'],
    });
  });

  /**
   * Expected behavior:
   * - The version is properly handled
   */
  it('should properly handle version plugin prop', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        version: '1.2.345',
      },
    });
    await prebuildProject(TEMP_DIR, 'android');
    expectFile({
      projectRoot: TEMP_DIR,
      fileName: 'build.gradle.kts',
      content: ['version = "1.2.345"'],
    });
  });

  /**
   * Expected behavior:
   * - The publishing configuration is properly handled
   */
  it('should properly handle publishing configuration plugin prop', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        publishing: [
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
        ],
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    const publishingLines = [
      'localDefault {',
      'type = "localMaven"',
      'localDirectory1 {',
      'type = "localDirectory"',
      'url = "file://',
      'testapppluginandroid/local-maven-repo"',
      'remotePublic1 {',
      'type = "remotePublic"',
      'url = "https://example.com/repository"',
      'remotePrivate1 {',
      'type = "remotePrivate"',
      'url = "https://example.com/private-repository"',
      'username = "myusername"',
      'password = "mypassword"',
    ];
    validateBuildGradle(TEMP_DIR, publishingLines);
  });

  /**
   * Expected behavior:
   * - Multiple repositories of the same type are properly handled
   *   by prefixing publication names with numbers
   */
  it('should properly handle mulitple repos of the same type', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        publishing: [
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
        ],
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    const publishingLines = [
      'localDefault {',
      'type = "localMaven"',
      'localDirectory1 {',
      'type = "localDirectory"',
      'url = "file://',
      'testapppluginandroid/local-maven-repo"',
      'localDirectory2 {',
      'type = "localDirectory"',
      'url = "file://',
      'testapppluginandroid/local-maven-repo-2"',
    ];
    validateBuildGradle(TEMP_DIR, publishingLines);
  });

  /**
   * Expected behavior:
   * - Multiple repositories of the same type with different names are properly handled
   */
  it('should properly handle mulitple repos of the same type with different names', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        publishing: [
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
        ],
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    const publishingLines = [
      'localDefault {',
      'type = "localMaven"',
      'localMavenRepo {',
      'type = "localDirectory"',
      'url = "file://',
      'testapppluginandroid/local-maven-repo"',
      'localMavenRepo256 {',
      'type = "localDirectory"',
      'url = "file://',
      'testapppluginandroid/local-maven-repo-2"',
    ];
    validateBuildGradle(TEMP_DIR, publishingLines);
  });

  /**
   * Expected behavior:
   * - The path is properly resolved for localDirectory repositories
   */
  it('should properly resolve paths for localDirectory repositories', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        publishing: [
          {
            type: 'localDirectory',
            path: './local-maven-repo',
          },
          {
            type: 'localDirectory',
            path: '/tmp/local-maven-repo-home',
          },
        ],
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    const publishingLines = [
      'localDirectory1 {',
      'type = "localDirectory"',
      'url = "file://',
      'testapppluginandroid/local-maven-repo"',
      'localDirectory2 {',
      'type = "localDirectory"',
      'url = "file://',
      '/tmp/local-maven-repo-home"',
    ];
    validateBuildGradle(TEMP_DIR, publishingLines);
  });

  /**
   * Expected behavior:
   * - Environment variables are properly handled in repository configuration
   */
  it('should properly handle environment variables in repository configuration', async () => {
    await createEnvFile(TEMP_DIR, {
      MAVEN_PUBLISHING_URL: 'https://example.com/secret-repository',
      MAVEN_PUBLISHING_USERNAME: 'secretusername1234',
      MAVEN_PUBLISHING_PASSWORD: 'secretpassword1234',
    });
    await addPlugin(TEMP_DIR, {
      android: {
        publishing: [
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
        ],
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    const publishingLines = [
      'remotePrivate1 {',
      'type = "remotePrivate"',
      'url = "https://example.com/secret-repository"',
      'username = "secretusername1234"',
      'password = "secretpassword1234"',
    ];
    validateBuildGradle(TEMP_DIR, publishingLines);
  });

  /**
   * Expected behavior:
   * - The allowInsecure option is properly handled
   */
  it('should properly handle allowInsecure option for repositories', async () => {
    await addPlugin(TEMP_DIR, {
      android: {
        publishing: [
          {
            type: 'remotePublic',
            url: 'http://example.com/public-repository',
            allowInsecure: true,
          },
        ],
      },
    });
    await prebuildProject(TEMP_DIR, 'android');

    const publishingLines = [
      'remotePublic1 {',
      'type = "remotePublic"',
      'url = "http://example.com/public-repository"',
      'allowInsecure = true',
    ];
    validateBuildGradle(TEMP_DIR, publishingLines);
  });
});
