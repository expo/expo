import { BUILD, BUILD_ANDROID, ERROR } from '../../utils/output';
import { CLI_PATH, executeCommandAsync } from '../../utils/process';
import { cleanUpProject, createTempProject } from '../../utils/project';
import { buildAndroidTest, buildTestCommon, expectPrebuild } from '../../utils/test';

let TEMP_DIR: string;
let TEMP_DIR_PREBUILD: string;

/**
 * Tests the `build:android` command
 * npx expo-brownfield build:android
 */
describe('build:android command', () => {
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
     * Command: npx expo-brownfield build:android --help/-h
     * Expected behavior: The CLI should display the full help message
     */
    it('should display help message for --help/-h/help <command> option', async () => {
      // Help message display shouldn't require prebuild
      await buildAndroidTest({
        directory: TEMP_DIR,
        args: ['--help'],
        useSnapshot: true,
      });
      await buildAndroidTest({
        directory: TEMP_DIR,
        args: ['-h'],
        useSnapshot: true,
      });
      await buildTestCommon({
        directory: TEMP_DIR,
        command: 'help',
        args: ['build:android'],
        useSnapshot: true,
      });
    });

    /**
     * Command: npx expo-brownfield build:android --invalid-flag
     * Expected behavior: The CLI should display the error message
     */
    it('should handle incorrect options', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR,
        args: ['--invalid-flag'],
        successExit: false,
        stderr: [ERROR.UNKNOWN_OPTION('--invalid-flag')],
      });
    });

    /**
     * Command: npx expo-brownfield build:android build:ios
     * Expected behavior: The CLI should display the error message
     */
    it("shouldn't allow passing another command", async () => {
      await buildAndroidTest({
        directory: TEMP_DIR,
        args: ['build:ios'],
        successExit: false,
        stderr: [ERROR.ADDITIONAL_COMMAND('build:android')],
      });
    });

    /**
     * Command: npx expo-brownfield build:android --library
     * Expected behavior: The CLI should display the error message about missing argument
     * (no need to test for all arguments as it's handled by commander)
     */
    it('should fail if argument value is not passed', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR,
        args: ['--library'],
        successExit: false,
        stderr: [ERROR.MISSING_ARGUMENT('l', 'library', 'library')],
      });
    });

    /**
     * Command: npx expo-brownfield build:android
     * Expected behavior: The CLI should fail if prebuild is cancelled
     */
    it('should fail if prebuild is cancelled', async () => {
      // The command fails, because `expo-brownfield` is not added to app.json
      // But the prebuild should succeed
      const { exitCode, stdout, stderr } = await executeCommandAsync(
        TEMP_DIR,
        'bash',
        ['-c', `yes no | node ${CLI_PATH} build:android --repo MavenLocal`],
        { ignoreErrors: true }
      );
      expect(exitCode).not.toBe(0);
      expect(stdout).toContain(BUILD.PREBUILD_WARNING('android'));
      expect(stdout).toContain(BUILD.PREBUILD_PROMPT);
      expect(stderr).toContain(ERROR.MISSING_PREBUILD());
    });

    /**
     * Command: npx expo-brownfield build:android
     * Expected behavior: The CLI should validate and ask for prebuild
     */
    it('should validate and ask for prebuild', async () => {
      // The command fails, because `expo-brownfield` is not added to app.json
      // But the prebuild should succeed
      const { exitCode, stdout, stderr } = await executeCommandAsync(
        TEMP_DIR,
        'bash',
        ['-c', `yes | node ${CLI_PATH} build:android --repo MavenLocal`],
        { ignoreErrors: true }
      );
      expect(exitCode).not.toBe(0);
      expect(stdout).toContain(BUILD.PREBUILD_WARNING('android'));
      expect(stdout).toContain(BUILD.PREBUILD_PROMPT);
      expect(stderr).toContain('Could not find brownfield library in the project');

      // The android directory should be created and not empty
      await expectPrebuild(TEMP_DIR, 'android');
    });
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
     * Command: npx expo-brownfield build:android --task someGradleTask --dry-run
     * Expected behavior: The CLI should print the task it would execute
     */
    it('should build the project', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--task', 'someGradleTask', '--dry-run'],
        stdout: ['./gradlew someGradleTask'],
      });
    });

    /**
     * Command: npx expo-brownfield build:android --task someGradleTask --dry-run
     * Expected behavior: The CLI should print the inferred build configuration
     */
    it('should infer and print build configuration', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--task', 'someGradleTask', '--dry-run'],
        useSnapshot: true,
      });
    });

    /**
     * Command: npx expo-brownfield build:android --task someGradleTask --dry-run --verbose
     * Expected behavior: The CLI should print the verbose configuration
     */
    it('should properly handle --verbose option', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--task', 'someGradleTask', '--dry-run', '--verbose'],
        stdout: [BUILD.VERBOSE],
      });
    });

    /**
     * Command: npx expo-brownfield build:android --repo MavenLocal --dry-run --debug/-d
     * Expected behavior: The CLI should print the debug configuration and execute correct tasks
     */
    it('should properly handle --debug option', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '--debug'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_DEBUG,
          `./gradlew publishBrownfieldDebugPublicationToMavenLocal`,
        ],
      });
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '--debug'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_DEBUG,
          `./gradlew publishBrownfieldDebugPublicationToMavenLocal`,
        ],
      });
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '-d'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_DEBUG,
          `./gradlew publishBrownfieldDebugPublicationToMavenLocal`,
        ],
      });
    });

    /**
     * Command: npx expo-brownfield build:android --repo MavenLocal --dry-run --release/-r     * Command: npx expo-brownfield build:android --repo MavenLocal --dry-run --release/-r
     * Expected behavior: The CLI should print the release configuration and execute correct tasks
     */
    it('should properly handle --release option', async () => {
      // Full version: --release
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '--release'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_RELEASE,
          `./gradlew publishBrownfieldReleasePublicationToMavenLocal`,
        ],
      });
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '-r'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_RELEASE,
          `./gradlew publishBrownfieldReleasePublicationToMavenLocal`,
        ],
      });
      // Short version: -r
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '-r'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_RELEASE,
          `./gradlew publishBrownfieldReleasePublicationToMavenLocal`,
        ],
      });
    });

    /**
     * Command: npx expo-brownfield build:android --repo MavenLocal --dry-run --all/-a
     *  (or --release/-r + --debug/-d)
     * Expected behavior: The CLI should print the all configuration and execute correct tasks
     */
    it('should properly handle --all option', async () => {
      // Full version: --all
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '--all'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_ALL,
          `./gradlew publishBrownfieldAllPublicationToMavenLocal`,
        ],
      });

      // Short version: -a
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '-a'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_ALL,
          `./gradlew publishBrownfieldAllPublicationToMavenLocal`,
        ],
      });

      // Combination of the two flags: --release/-r + --debug/-d
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '--release', '-d'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_ALL,
          `./gradlew publishBrownfieldAllPublicationToMavenLocal`,
        ],
      });
    });

    /**
     * Command: npx expo-brownfield build:android --repo MavenLocal --dry-run --library/-l brownfieldlib
     * Expected behavior: The CLI should print the library configuration and execute correct tasks
     */
    it('should properly handle --library option', async () => {
      // Full version: --library
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '--library', 'brownfieldlib'],
        stdout: [BUILD_ANDROID.LIBRARY, `./gradlew publishBrownfieldAllPublicationToMavenLocal`],
      });

      // Short version: -l
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--dry-run', '-l', 'brownfieldlib'],
        stdout: [BUILD_ANDROID.LIBRARY, `./gradlew publishBrownfieldAllPublicationToMavenLocal`],
      });
    });

    /**
     * Command: npx expo-brownfield build:android --task/t task (multiple can be passed)
     * Expected behavior: The CLI should print the tasks configuration and execute correct tasks
     */
    it('should properly handle --task/-t option(s)', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--task', 'task1', '-t', 'task2', 'task3', '--dry-run'],
        stdout: [...BUILD_ANDROID.TASKS, `./gradlew task1`, `./gradlew task2`, `./gradlew task3`],
      });
    });

    /**
     * Command: npx expo-brownfield build:android --repo MavenLocal --repository CustomLocal --dry-run
     * Expected behavior: The CLI should print the repositories configuration and execute correct tasks
     */
    it('should properly handle --repo/--repository option(s)', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--repository', 'CustomLocal', 'RemotePublic', '--dry-run'],
        stdout: [
          `./gradlew publishBrownfieldAllPublicationToMavenLocal`,
          `./gradlew publishBrownfieldAllPublicationToCustomLocalRepository`,
          `./gradlew publishBrownfieldAllPublicationToRemotePublicRepository`,
        ],
      });
    });

    /**
     * Command: npx expo-brownfield build:android --repo MavenLocal --task task1 --dry-run
     * Expected behavior: Tasks should take precedence over repositories. Correct task should be executed
     */
    it('should resolve both tasks and repositories', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--task', 'task1', '--dry-run'],
        stdout: [
          ...BUILD_ANDROID.TASK,
          `./gradlew task1`,
          `./gradlew publishBrownfieldAllPublicationToMavenLocal`,
        ],
      });
    });

    /**
     * Command: npx expo-brownfield build:android <various configurations> --dry-run
     * Expected behavior: Correct tasks should be constructed and executed
     */
    it('should properly construct and execute tasks for various configurations', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'MavenLocal', '--debug', '--dry-run'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_DEBUG,
          `./gradlew publishBrownfieldDebugPublicationToMavenLocal`,
        ],
      });
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--repo', 'CustomDir', '--repository', 'CustomLocal', '--release', '--dry-run'],
        stdout: [
          BUILD_ANDROID.BUILD_VARIANT_RELEASE,
          `./gradlew publishBrownfieldReleasePublicationToCustomDirRepository`,
          `./gradlew publishBrownfieldReleasePublicationToCustomLocalRepository`,
        ],
      });
    });

    /**
     * Command: npx expo-brownfield build:android
     * Expected behavior: The CLI should print an error message and exit
     */
    it('should print an error message and exit if no tasks or repositories are specified', async () => {
      await buildAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        successExit: false,
        stderr: [ERROR.MISSING_TASKS_OR_REPOSITORIES()],
      });
    });
  });
});
