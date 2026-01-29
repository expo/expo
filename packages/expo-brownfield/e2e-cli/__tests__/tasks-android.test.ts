import { ERROR, TASKS_ANDROID } from '../utils/output';
import { createTempProject, cleanUpProject } from '../utils/project';
import { tasksAndroidTest } from '../utils/test';

let TEMP_DIR: string;
let TEMP_DIR_PREBUILD: string;

/**
 * Tests the `tasks:android` command
 * npx expo-brownfield tasks:android
 */
describe('tasks:android command', () => {
  /**
   * Part of the cases doesn't and shouldn't require prebuild to be done
   */
  describe('without prebuild', () => {
    beforeAll(async () => {
      TEMP_DIR = await createTempProject('tasksandroidnopb');
    }, 600000);

    afterAll(async () => {
      await cleanUpProject('tasksandroidnopb');
    }, 600000);

    /**
     * Command: npx expo-brownfield tasks:android --help/-h
     * Expected behavior: The CLI should display the full help message
     */
    it('should display help message for --help/-h option', async () => {
      // Help message display shouldn't require prebuild
      await tasksAndroidTest({
        directory: TEMP_DIR,
        args: ['--help'],
        useSnapshot: true,
      });
      await tasksAndroidTest({
        directory: TEMP_DIR,
        args: ['-h'],
        useSnapshot: true,
      });
    });

    /**
     * Command: npx expo-brownfield tasks:android --invalid-flag
     * Expected behavior: The CLI should display the error message
     */
    it('should handle incorrect options', async () => {
      await tasksAndroidTest({
        directory: TEMP_DIR,
        args: ['--invalid-flag'],
        successExit: false,
        stderr: [ERROR.UNKNOWN_OPTION('--invalid-flag')],
      });
    });

    /**
     * Command: npx expo-brownfield tasks:android build:android
     * Expected behavior: The CLI should display the error message
     */
    it("shouldn't allow passing another command", async () => {
      await tasksAndroidTest({
        directory: TEMP_DIR,
        args: ['build:android'],
        successExit: false,
        stderr: [ERROR.ADDITIONAL_COMMAND('tasks:android')],
      });
    });
  });

  /**
   * Part of the cases should require prebuild to be done
   */
  describe('with prebuild', () => {
    beforeAll(async () => {
      TEMP_DIR_PREBUILD = await createTempProject('tasksandroidpb', true);
    }, 600000);

    afterAll(async () => {
      await cleanUpProject('tasksandroidpb');
    }, 600000);

    /**
     * Command: npx expo-brownfield tasks:android
     * Expected behavior: The CLI should properly list available publishing tasks
     */
    it('should properly list available tasks', async () => {
      await tasksAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run'],
        stdout: TASKS_ANDROID.RESULT,
      });
    });

    /**
     * Command: npx expo-brownfield tasks:android --library/-l <library-name>
     * Expected behavior: The CLI should use the provided library name instead of inferring it
     */
    it('should properly handle --library/-l option', async () => {
      await tasksAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--library', 'brownfield'],
        stdout: TASKS_ANDROID.RESULT,
      });

      await tasksAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '-l', 'brownfield'],
        stdout: TASKS_ANDROID.RESULT,
      });

      await tasksAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '-l', 'wrongbrownfield'],
        successExit: false,
        stderr: new Set<string>(TASKS_ANDROID.RESULT),
      });
    });

    /**
     * Command: npx expo-brownfield tasks:android
     * Expected behavior: The CLI shouldn't print verbose output by default
     */
    it("shouldn't print verbose output by default", async () => {
      await tasksAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run'],
        stdout: new Set<string>(TASKS_ANDROID.VERBOSE),
      });
    });

    /**
     * Command: npx expo-brownfield tasks:android --verbose
     * Expected behavior: The CLI should print verbose output
     */
    it('should properly handle --verbose option', async () => {
      await tasksAndroidTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--verbose'],
        stdout: TASKS_ANDROID.VERBOSE,
      });
    });
  });
});
