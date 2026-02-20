import { VERSION } from '../../utils/output';
import { executeCLIASync } from '../../utils/process';
import { createTempProject, cleanUpProject } from '../../utils/project';

let TEMP_DIR: string;

/**
 * Tests the --version option
 * npx expo-brownfield --version/-v
 */
describe('--version option', () => {
  beforeAll(async () => {
    TEMP_DIR = await createTempProject('version');
  }, 600000);

  afterAll(async () => {
    await cleanUpProject('version');
  }, 600000);

  /**
   * Command: npx expo-brownfield --version
   * Expected behavior: The CLI should return the correct version
   */
  it('should return correct version', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['--version']);
    expect(exitCode).toBe(0);
    expect(stdout).toBe(VERSION);
  });

  /**
   * Command: npx expo-brownfield -v
   * Expected behavior: The CLI should support the `-v` shorthand
   */
  it('should support `-v` shorthand', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['-v']);
    expect(exitCode).toBe(0);
    expect(stdout).toBe(VERSION);
  });

  /**
   * Command: npx expo-brownfield --version tasks:android
   * Expected behavior: The `--version` option should be executed instead of the command
   */
  it('should take precedence over the command', async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['--version', 'tasks:android']);
    expect(exitCode).toBe(0);
    expect(stdout).toBe(VERSION);
  });

  /**
   * Command: npx expo-brownfield --version -v --version
   * Expected behavior: The `--version` option can be passed multiple times
   */
  it("shouldn't break when option is passed multiple times", async () => {
    const { stdout, exitCode } = await executeCLIASync(TEMP_DIR, ['--version', '-v', '--version']);
    expect(exitCode).toBe(0);
    expect(stdout).toBe(VERSION);
  });
});
