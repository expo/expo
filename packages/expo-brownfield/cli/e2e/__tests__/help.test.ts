import { executeCLIASync, stripAnsi } from '../utils/process';
import { createTempProject, cleanUpProject } from '../utils/project';

const FULL_HELP_MESSAGE = `Usage: expo-brownfield <command>  [<options>]\n
Options:
  --version, -v                 output the version number
  --help, -h                    display help for command\n
Commands:
  build-android [<options>]     build and publish Android brownfield artifacts
  build-ios [<options>]         build iOS brownfield artifacts
  tasks-android [<options>]     list available publishing tasks and repositories for android`;
const HELP_MESSAGE_HEADER = `Usage: expo-brownfield <command>  [<options>]`;

let TEMP_DIR: string;

/**
 * Tests the --help option
 * npx expo-brownfield --help/-h
 */
describe('--help option', () => {
  beforeAll(async () => {
    TEMP_DIR = await createTempProject('help');
  }, 600000);

  afterAll(async () => {
    await cleanUpProject('help');
  }, 600000);

  /**
   * Command: npx expo-brownfield --help
   * Expected behavior: The CLI should return the correct help message
   */
  it('should return the correct help message', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['--help']);
    expect(exitCode).toBe(0);
    expect(stripAnsi(stdout.trim())).toContain(FULL_HELP_MESSAGE);
  });

  /**
   * Command: npx expo-brownfield -h
   * Expected behavior: The CLI should support the `-h` shorthand
   */
  it('should support the `-h` shorthand', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['-h']);
    expect(exitCode).toBe(0);
    expect(stripAnsi(stdout.trim())).toContain(HELP_MESSAGE_HEADER);
  });

  /**
   * Command: npx expo-brownfield tasks-android --help
   * Expected behavior: The CLI should not print general help after a command is used
   */
  it("shouldn't print general help after a command is used", async () => {
    const { stdout } = await executeCLIASync(TEMP_DIR, ['tasks-android', '--help'], {
      ignoreErrors: true,
    });
    expect(stripAnsi(stdout.trim())).not.toContain(HELP_MESSAGE_HEADER);
  });

  /**
   * Command: npx expo-brownfield --version --help
   * Expected behavior: The `--help` option should take precedence over `--version`
   */
  it('should take precedence over `--version`', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['--version', '--help']);
    expect(exitCode).toBe(0);
    expect(stripAnsi(stdout.trim())).toContain(HELP_MESSAGE_HEADER);
  });

  /**
   * Command: npx expo-brownfield --help tasks-android
   * Expected behavior: The `--help` option should take precedence over the command
   */
  it('should take precedence over the command', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['--help', 'tasks-android']);
    expect(exitCode).toBe(0);
    expect(stripAnsi(stdout.trim())).toContain(HELP_MESSAGE_HEADER);
  });

  /**
   * Command: npx expo-brownfield --help -h --help
   * Expected behavior: The `--help` option can be passed multiple times
   */
  it("shouldn't break when option is passed multiple times", async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['--help', '-h', '--help']);
    expect(exitCode).toBe(0);
    expect(stripAnsi(stdout.trim())).toContain(HELP_MESSAGE_HEADER);
  });
});
