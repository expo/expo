import { BUILD, BUILD_ANDROID, ERROR, HELP_MESSAGE } from '../utils/output';
import { executeCommandAsync } from '../utils/process';
import { cleanUpProject, createTempProject } from '../utils/project';
import { buildAndroidTest, expectPrebuild } from '../utils/test';

let TEMP_DIR: string;
let TEMP_DIR_PREBUILD: string;

/**
 * Tests the `build-android` command
 * npx expo-brownfield build-android
 */
describe('build-android command', () => {
  /**
   * Part of the cases doesn't and shouldn't require prebuild to be done
   */
  describe('without prebuild', () => {
    beforeAll(async () => {
      TEMP_DIR = await createTempProject('buildandroidnopb');
    }, 600000);

    afterAll(async () => {
      await cleanUpProject('buildandroidnopb');
    }, 600000);

    /**
     * Command: npx expo-brownfield build-android --help/-h
     * Expected behavior: The CLI should display the full help message
     */
    it('should display help message for --help/-h option', async () => {
      // Help message display shouldn't require prebuild
      await buildAndroidTest(TEMP_DIR, ['--help'], true, [HELP_MESSAGE.BUILD_ANDROID]);
      await buildAndroidTest(TEMP_DIR, ['-h'], true, [HELP_MESSAGE.BUILD_ANDROID]);
    });

    /**
     * Command: npx expo-brownfield build-android --invalid-flag
     * Expected behavior: The CLI should display the error message
     */
    it('should handle incorrect options', async () => {
      await buildAndroidTest(
        TEMP_DIR,
        ['--invalid-flag'],
        false,
        [],
        [ERROR.UNKNOWN_OPTION('--invalid-flag')]
      );
    });

    /**
     * Command: npx expo-brownfield build-android build-ios
     * Expected behavior: The CLI should display the error message
     */
    it("shouldn't allow passing another command", async () => {
      await buildAndroidTest(
        TEMP_DIR,
        ['build-ios'],
        false,
        [],
        [ERROR.ADDITIONAL_COMMAND('build-android')]
      );
    });

    /**
     * Command: npx expo-brownfield build-android
     * Expected behavior: The CLI should validate and ask for prebuild
     */
    it('should validate and ask for prebuild', async () => {
      // The command fails, because `expo-brownfield` is not added to app.json
      // But the prebuild should succeed
      const { exitCode, stdout, stderr } = await executeCommandAsync(
        TEMP_DIR,
        'bash',
        ['-c', 'yes | npx expo-brownfield build-android'],
        { ignoreErrors: true }
      );
      expect(exitCode).not.toBe(0);
      expect(stdout).toContain(BUILD.PREBUILD_WARNING('android'));
      expect(stdout).toContain(BUILD.PREBUILD_PROMPT);
      // TODO(pmleczek): Refactor CLI error handling
      expect(stderr).toContain(`Error: Value of Android library name`);
      expect(stderr).toContain(`could not be inferred from the project`);

      // The android directory should be created and not empty
      await expectPrebuild(TEMP_DIR, 'android');
    });

    // TODO(pmleczek): Verify failure if prebuild is not done
  });

  /**
   * Part of the cases should require prebuild to be done
   */
  describe('with prebuild', () => {
    beforeAll(async () => {
      TEMP_DIR_PREBUILD = await createTempProject('buildandroidpb', true);
    }, 600000);

    afterAll(async () => {
      await cleanUpProject('buildandroidpb');
    }, 600000);

    /**
     * Command: npx expo-brownfield build-android --task someGradleTask --dry-run
     * Expected behavior: The CLI should print the task it would execute
     */
    it('should build the project', async () => {
      await buildAndroidTest(TEMP_DIR_PREBUILD, ['--task', 'someGradleTask', '--dry-run'], true, [
        './gradlew someGradleTask',
      ]);
    });

    /**
     * Command: npx expo-brownfield build-android --task someGradleTask --dry-run
     * Expected behavior: The CLI should print the inferred build configuration
     */
    it('should infer and print build configuration', async () => {
      await buildAndroidTest(TEMP_DIR_PREBUILD, ['--task', 'someGradleTask', '--dry-run'], true, [
        BUILD_ANDROID.CONFIGURATION,
      ]);
    });

    /**
     * Command: npx expo-brownfield build-android --task someGradleTask --dry-run --verbose
     * Expected behavior: The CLI should print the verbose configuration
     */
    it('should properly handle --verbose option', async () => {
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--task', 'someGradleTask', '--dry-run', '--verbose'],
        true,
        [BUILD.VERBOSE]
      );
    });

    /**
     * Command: npx expo-brownfield build-android --repo MavenLocal --dry-run --debug/-d
     * Expected behavior: The CLI should print the debug configuration and execute correct tasks
     */
    it('should properly handle --debug option', async () => {
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--dry-run', '--debug'],
        true,
        [BUILD.BUILD_TYPE_DEBUG, `./gradlew publishBrownfieldDebugPublicationToMavenLocal`]
      );
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--dry-run', '--debug'],
        true,
        [BUILD.BUILD_TYPE_DEBUG, `./gradlew publishBrownfieldDebugPublicationToMavenLocal`]
      );
      await buildAndroidTest(TEMP_DIR_PREBUILD, ['--repo', 'MavenLocal', '--dry-run', '-d'], true, [
        BUILD.BUILD_TYPE_DEBUG,
        `./gradlew publishBrownfieldDebugPublicationToMavenLocal`,
      ]);
    });

    /**
     * Command: npx expo-brownfield build-android --repo MavenLocal --dry-run --release/-r     * Command: npx expo-brownfield build-android --repo MavenLocal --dry-run --release/-r
     * Expected behavior: The CLI should print the release configuration and execute correct tasks
     */
    it('should properly handle --release option', async () => {
      // Full version: --release
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--dry-run', '--release'],
        true,
        [BUILD.BUILD_TYPE_RELEASE, `./gradlew publishBrownfieldReleasePublicationToMavenLocal`]
      );
      await buildAndroidTest(TEMP_DIR_PREBUILD, ['--repo', 'MavenLocal', '--dry-run', '-r'], true, [
        BUILD.BUILD_TYPE_RELEASE,
        `./gradlew publishBrownfieldReleasePublicationToMavenLocal`,
      ]);
      // Short version: -r
      await buildAndroidTest(TEMP_DIR_PREBUILD, ['--repo', 'MavenLocal', '--dry-run', '-r'], true, [
        BUILD.BUILD_TYPE_RELEASE,
        `./gradlew publishBrownfieldReleasePublicationToMavenLocal`,
      ]);
    });

    /**
     * Command: npx expo-brownfield build-android --repo MavenLocal --dry-run --all/-a
     *  (or --release/-r + --debug/-d)
     * Expected behavior: The CLI should print the all configuration and execute correct tasks
     */
    it('should properly handle --all option', async () => {
      // Full version: --all
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--dry-run', '--all'],
        true,
        [BUILD.BUILD_TYPE_ALL, `./gradlew publishBrownfieldAllPublicationToMavenLocal`]
      );

      // Short version: -a
      await buildAndroidTest(TEMP_DIR_PREBUILD, ['--repo', 'MavenLocal', '--dry-run', '-a'], true, [
        BUILD.BUILD_TYPE_ALL,
        `./gradlew publishBrownfieldAllPublicationToMavenLocal`,
      ]);

      // Combination of the two flags: --release/-r + --debug/-d
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--dry-run', '--release', '-d'],
        true,
        [BUILD.BUILD_TYPE_ALL, `./gradlew publishBrownfieldAllPublicationToMavenLocal`]
      );
    });

    /**
     * Command: npx expo-brownfield build-android --repo MavenLocal --dry-run --library/-l brownfieldlib
     * Expected behavior: The CLI should print the library configuration and execute correct tasks
     */
    it('should properly handle --library option', async () => {
      // Full version: --library
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--dry-run', '--library', 'brownfieldlib'],
        true,
        [BUILD_ANDROID.LIBRARY, `./gradlew publishBrownfieldAllPublicationToMavenLocal`]
      );

      // Short version: -l
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--dry-run', '-l', 'brownfieldlib'],
        true,
        [BUILD_ANDROID.LIBRARY, `./gradlew publishBrownfieldAllPublicationToMavenLocal`]
      );
    });

    /**
     * Command: npx expo-brownfield build-android --task/t task (multiple can be passed)
     * Expected behavior: The CLI should print the tasks configuration and execute correct tasks
     */
    it('should properly handle --task/-t option(s)', async () => {
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--task', 'task1', '-t', 'task2', '--task', 'task3', '--dry-run'],
        true,
        [BUILD_ANDROID.TASKS, `./gradlew task1`, `./gradlew task2`, `./gradlew task3`]
      );
    });

    /**
     * Command: npx expo-brownfield build-android --repo MavenLocal --repository CustomLocal --dry-run
     * Expected behavior: The CLI should print the repositories configuration and execute correct tasks
     */
    it('should properly handle --repo/--repository option(s)', async () => {
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--repository', 'CustomLocal', '--dry-run'],
        true,
        [
          BUILD_ANDROID.REPOSTORIES,
          `./gradlew publishBrownfieldAllPublicationToMavenLocal`,
          `./gradlew publishBrownfieldAllPublicationToCustomLocalRepository`,
        ]
      );
    });

    /**
     * Command: npx expo-brownfield build-android --repo MavenLocal --task task1 --dry-run
     * Expected behavior: Tasks should take precedence over repositories. Correct task should be executed
     */
    it('tasks should take precedence over repositories', async () => {
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--task', 'task1', '--dry-run'],
        true,
        [BUILD_ANDROID.TASK, `./gradlew task1`]
      );
    });

    /**
     * Command: npx expo-brownfield build-android <various configurations> --dry-run
     * Expected behavior: Correct tasks should be constructed and executed
     */
    it('should properly construct and execute tasks for various configurations', async () => {
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'MavenLocal', '--debug', '--dry-run'],
        true,
        [BUILD.BUILD_TYPE_DEBUG, `./gradlew publishBrownfieldDebugPublicationToMavenLocal`]
      );
      await buildAndroidTest(
        TEMP_DIR_PREBUILD,
        ['--repo', 'CustomDir', '--repository', 'CustomLocal', '--release', '--dry-run'],
        true,
        [
          BUILD.BUILD_TYPE_RELEASE,
          `./gradlew publishBrownfieldReleasePublicationToCustomDirRepository`,
          `./gradlew publishBrownfieldReleasePublicationToCustomLocalRepository`,
        ]
      );
    });
  });
});
