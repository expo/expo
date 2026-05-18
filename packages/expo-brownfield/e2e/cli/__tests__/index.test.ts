import { ERROR, HELP_MESSAGE, VERSION } from '../../utils/output';
import { CLI_PATH, executeCLIASync, executeCommandAsync } from '../../utils/process';
import { createTempProject, cleanUpProject } from '../../utils/project';

const TASKS_ANDROID_ERROR = `Error: Value of Android library name: ENOENT: no such file or directory`;

let TEMP_DIR: string;

/**
 * Tests the CLI
 * npx expo-brownfield
 */
describe('basic cli tests', () => {
  beforeAll(async () => {
    TEMP_DIR = await createTempProject('index');
  }, 600000);

  afterAll(async () => {
    await cleanUpProject('index');
  }, 600000);

  /**
   * Command: npx expo-brownfield tasks:android
   * Expected behavior: The CLI should display an error message
   */
  it('should correctly parse passed commands', async () => {
    const { exitCode, stderr } = await executeCommandAsync(
      TEMP_DIR,
      'bash',
      ['-c', `yes no | node ${CLI_PATH} build:android --repo MavenLocal`],
      { ignoreErrors: true }
    );
    // Expect error because we haven't run prebuild
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(ERROR.MISSING_PREBUILD());
  });

  /**
   * Command: npx expo-brownfield --version --help
   * Expected behavior: The CLI correctly parses passed flags
   */
  it('should correctly parse passed flags', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['--version', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain(VERSION);
  });

  /**
   * Command: npx expo-brownfield
   * Expected behavior: The CLI should display general help message
   */
  it('should display help message if no arguments are provided', async () => {
    const { stderr, exitCode } = await executeCLIASync(TEMP_DIR, [], { ignoreErrors: true });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(HELP_MESSAGE.GENERAL_HEADER);
  });

  /**
   * Command: npx expo-brownfield unknown:command
   * Expected behavior: The CLI should display an error message
   */
  it('should display an error message if unknown command is provided', async () => {
    const { stderr, exitCode } = await executeCLIASync(TEMP_DIR, ['unknown:command'], {
      ignoreErrors: true,
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(ERROR.UNKNOWN_COMMAND('unknown:command'));
  });

  /**
   * Command: npx expo-brownfield --unknown:flag
   * Expected behavior: The CLI should display an error message
   */
  it('should display an error message if unknown flag is provided', async () => {
    const { stderr, exitCode } = await executeCLIASync(TEMP_DIR, ['--unknown-flag'], {
      ignoreErrors: true,
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(ERROR.UNKNOWN_OPTION('--unknown-flag'));
  });

  /**
   * Command: npx expo-brownfield build:android build:ios
   * Expected behavior: The CLI should display the unkown arg error message for the first command
   */
  it('should allow passing only one command', async () => {
    const { stderr, exitCode } = await executeCLIASync(TEMP_DIR, ['build:android', 'build:ios'], {
      ignoreErrors: true,
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(ERROR.ADDITIONAL_COMMAND('build:android'));
  });
});
