import { ExpectedOutput } from '../utils/output';
import { executeCLIASync } from '../utils/process';
import { createTempProject, cleanUpProject } from '../utils/project';

let TEMP_DIR: string;
let TEMP_DIR_PREBUILD: string;

/**
 * Tests the `tasks-android` command
 * npx expo-brownfield tasks-android
 */
describe('tasks-android command', () => {
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
     * Command: npx expo-brownfield tasks-android --help/-h
     * Expected behavior: The CLI should display the full help message
     */
    it('should display help message for --help/-h option', async () => {
      // Help message display shouldn't require prebuild
      let result = await executeCLIASync(TEMP_DIR, ['tasks-android', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(ExpectedOutput.TasksAndroidHelp.Full);

      result = await executeCLIASync(TEMP_DIR, ['tasks-android', '-h']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(ExpectedOutput.TasksAndroidHelp.Full);
    });

    /**
     * Command: npx expo-brownfield tasks-android --invalid-flag
     * Expected behavior: The CLI should display the error message
     */
    it('should handle incorrect options', async () => {
      const { exitCode, stderr } = await executeCLIASync(
        TEMP_DIR,
        ['tasks-android', '--invalid-flag'],
        { ignoreErrors: true }
      );
      expect(exitCode).toBe(1);
      expect(stderr).toContain(ExpectedOutput.Error.UnknownOption('--invalid-flag'));
    });

    /**
     * Command: npx expo-brownfield tasks-android build-android
     * Expected behavior: The CLI should display the error message
     */
    it("shouldn't allow passing another command", async () => {
      const { exitCode, stderr } = await executeCLIASync(
        TEMP_DIR,
        ['tasks-android', 'build-android'],
        { ignoreErrors: true }
      );
      expect(exitCode).toBe(1);
      expect(stderr).toContain(ExpectedOutput.Error.AdditionalCommand('tasks-android'));
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
     * Command: npx expo-brownfield tasks-android
     * Expected behavior: The CLI should properly list available publishing tasks
     */
    it('should properly list available tasks', async () => {
      const { stdout, exitCode } = await executeCLIASync(TEMP_DIR_PREBUILD, ['tasks-android']);
      expect(exitCode).toBe(0);
      ExpectedOutput.TasksAndroid.Result.forEach((fragment) => {
        expect(stdout).toContain(fragment);
      });
    });

    /**
     * Command: npx expo-brownfield tasks-android --library/-l <library-name>
     * Expected behavior: The CLI should use the provided library name instead of inferring it
     */
    it('should properly handle --library/-l option', async () => {
      let result = await executeCLIASync(TEMP_DIR_PREBUILD, [
        'tasks-android',
        '--library',
        'brownfield',
      ]);
      expect(result.exitCode).toBe(0);
      ExpectedOutput.TasksAndroid.Result.forEach((fragment) => {
        expect(result.stdout).toContain(fragment);
      });

      result = await executeCLIASync(TEMP_DIR_PREBUILD, ['tasks-android', '-l', 'brownfield']);
      expect(result.exitCode).toBe(0);
      ExpectedOutput.TasksAndroid.Result.forEach((fragment) => {
        expect(result.stdout).toContain(fragment);
      });

      result = await executeCLIASync(
        TEMP_DIR_PREBUILD,
        ['tasks-android', '-l', 'wrongbrownfield'],
        { ignoreErrors: true }
      );
      expect(result.exitCode).not.toBe(0);
      ExpectedOutput.TasksAndroid.Result.forEach((fragment) => {
        expect(result.stdout).not.toContain(fragment);
      });
    });

    /**
     * Command: npx expo-brownfield tasks-android
     * Expected behavior: The CLI shouldn't print verbose output by default
     */
    it("shouldn't print verbose output by default", async () => {
      const { stdout, exitCode } = await executeCLIASync(TEMP_DIR_PREBUILD, ['tasks-android']);
      expect(exitCode).toBe(0);
      ExpectedOutput.TasksAndroid.Verbose.forEach((fragment) => {
        expect(stdout).not.toContain(fragment);
      });
    });

    /**
     * Command: npx expo-brownfield tasks-android --verbose
     * Expected behavior: The CLI should print verbose output
     */
    it('should properly handle --verbose option', async () => {
      const { stdout, exitCode } = await executeCLIASync(TEMP_DIR_PREBUILD, [
        'tasks-android',
        '--verbose',
      ]);
      expect(exitCode).toBe(0);
      ExpectedOutput.TasksAndroid.Verbose.forEach((fragment) => {
        expect(stdout).toContain(fragment);
      });
    });
  });
});
