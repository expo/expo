import { ExpectedOutput } from '../utils/output';
import { executeCLIASync } from '../utils/process';
import { createTempProject, cleanUpProject } from '../utils/project';

const HELP_MESSAGE_HEADER = `Usage: expo-brownfield <command>  [<options>]`;
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
   * Command: npx expo-brownfield tasks-android
   * Expected behavior: The CLI should display an error message
   */
  it('should correctly parse passed commands', async () => {
    const { stderr, exitCode } = await executeCLIASync(TEMP_DIR, ['tasks-android'], {
      ignoreErrors: true,
    });
    // Expect error because we haven't run prebuild
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(TASKS_ANDROID_ERROR);
  });

  /**
   * Command: npx expo-brownfield --version --help
   * Expected behavior: The CLI correctly parses passed flags
   */
  it('should correctly parse passed flags', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['--version', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain(HELP_MESSAGE_HEADER);
  });

  /**
   * Command: npx expo-brownfield
   * Expected behavior: The CLI should display general help message
   */
  it('should display help message if no arguments are provided', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, [], { ignoreErrors: true });
    expect(exitCode).toBe(0);
    expect(stdout).toContain(HELP_MESSAGE_HEADER);
  });

  /**
   * Command: npx expo-brownfield unknown-command
   * Expected behavior: The CLI should display an error message
   */
  it('should display an error message if unknown command is provided', async () => {
    const { stderr, exitCode } = await executeCLIASync(TEMP_DIR, ['unknown-command'], {
      ignoreErrors: true,
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(ExpectedOutput.Error.UnknownCommand());
  });

  /**
   * Command: npx expo-brownfield --unknown-flag
   * Expected behavior: The CLI should display an error message
   */
  it('should display an error message if unknown flag is provided', async () => {
    const { stderr, exitCode } = await executeCLIASync(TEMP_DIR, ['--unknown-flag'], {
      ignoreErrors: true,
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain(ExpectedOutput.Error.UnknownOption('--unknown-flag'));
  });

  // TODO(pmleczek): Test for passing more than one command
});
