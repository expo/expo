import path from 'path';

import { BUILD, BUILD_IOS, ERROR } from '../../utils/output';
import { CLI_PATH, executeCommandAsync } from '../../utils/process';
import { cleanUpProject, createTempProject } from '../../utils/project';
import { buildIosTest, buildTestCommon, expectPrebuild } from '../../utils/test';

let TEMP_DIR: string;
let TEMP_DIR_PREBUILD: string;
const PREBUILD_WORKSPACE_NAME = 'buildiospb';

/**
 * Tests the `build:ios` command
 * npx expo-brownfield build:ios
 */
describe('build:ios command', () => {
  /**
   * Part of the cases doesn't and shouldn't require prebuild to be done
   */
  describe('without prebuild', () => {
    beforeAll(async () => {
      TEMP_DIR = await createTempProject('buildiosnopb');
    }, 600000);

    afterAll(async () => {
      await cleanUpProject('buildiosnopb');
    }, 600000);

    /**
     * Command: npx expo-brownfield build:android --help/-h
     * Expected behavior: The CLI should display the full help message
     */
    it('should display help message for --help/-h/help <command> option', async () => {
      // Help message display shouldn't require prebuild
      await buildIosTest({
        directory: TEMP_DIR,
        args: ['--help'],
        useSnapshot: true,
      });
      await buildIosTest({
        directory: TEMP_DIR,
        args: ['-h'],
        useSnapshot: true,
      });
      await buildTestCommon({
        directory: TEMP_DIR,
        command: 'help',
        args: ['build:ios'],
        useSnapshot: true,
      });
    });

    /**
     * Command: npx expo-brownfield build:ios --invalid-flag
     * Expected behavior: The CLI should display the error message
     */
    it('should handle incorrect options', async () => {
      await buildIosTest({
        directory: TEMP_DIR,
        args: ['--invalid-flag'],
        successExit: false,
        stderr: [ERROR.UNKNOWN_OPTION('--invalid-flag')],
      });
    });

    /**
     * Command: npx expo-brownfield build:ios build:android
     * Expected behavior: The CLI should display the error message
     */
    it("shouldn't allow passing another command", async () => {
      await buildIosTest({
        directory: TEMP_DIR,
        args: ['build:android'],
        successExit: false,
        stderr: [ERROR.ADDITIONAL_COMMAND('build:ios')],
      });
    });

    /**
     * Command: npx expo-brownfield build:ios --scheme
     * Expected behavior: The CLI should display the error message about missing argument
     * (no need to test for all arguments as it's handled by commander)
     */
    it('should fail if argument value is not passed', async () => {
      await buildIosTest({
        directory: TEMP_DIR,
        args: ['--scheme'],
        successExit: false,
        stderr: [ERROR.MISSING_ARGUMENT('s', 'scheme', 'scheme')],
      });
    });

    /**
     * Command: npx expo-brownfield build:ios
     * Expected behavior: The CLI should fail if prebuild is cancelled
     */
    it('should fail if prebuild is cancelled', async () => {
      // The command fails, because `expo-brownfield` is not added to app.json
      // But the prebuild should succeed
      const { exitCode, stdout, stderr } = await executeCommandAsync(
        TEMP_DIR,
        'bash',
        ['-c', `yes no | node ${CLI_PATH} build:ios`],
        { ignoreErrors: true }
      );
      expect(exitCode).not.toBe(0);
      expect(stdout).toContain(BUILD.PREBUILD_WARNING('ios'));
      expect(stdout).toContain(BUILD.PREBUILD_PROMPT);
      expect(stderr).toContain(ERROR.MISSING_PREBUILD());
    });

    /**
     * Command: npx expo-brownfield build:ios
     * Expected behavior: The CLI should validate and ask for prebuild
     */
    it('should validate and ask for prebuild', async () => {
      // The command fails, because `expo-brownfield` is not added to app.json
      // But the prebuild should succeed
      const { exitCode, stdout, stderr } = await executeCommandAsync(
        TEMP_DIR,
        'bash',
        ['-c', `yes | node ${CLI_PATH} build:ios`],
        { ignoreErrors: true }
      );
      expect(exitCode).not.toBe(0);
      expect(stdout).toContain(BUILD.PREBUILD_WARNING('ios'));
      expect(stdout).toContain(BUILD.PREBUILD_PROMPT);
      expect(stderr).toContain(`Could not find brownfield iOS scheme`);

      // The android directory should be created and not empty
      await expectPrebuild(TEMP_DIR, 'ios');
    });
  });

  /**
   * Part of the cases should require prebuild to be done
   */
  describe('with prebuild', () => {
    beforeAll(async () => {
      TEMP_DIR_PREBUILD = await createTempProject('buildiospb', true, true);
    }, 600000);

    afterAll(async () => {
      await cleanUpProject('buildiospb');
    }, 600000);

    /**
     * Command: npx expo-brownfield build:ios --dry-run
     * Expected behavior: The CLI should print the steps it would execute
     */
    it('should build the project', async () => {
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run'],
        stdout: [
          BUILD_IOS.ARTIFACT_CLEANUP,
          ...BUILD_IOS.BUILD_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Release'),
          ...BUILD_IOS.PACKAGE_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Release'),
          BUILD_IOS.HERMES_COPYING,
        ],
      });
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run
     * Expected behavior: The CLI should print the inferred build configuration
     */
    it('should infer and print build configuration', async () => {
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run'],
        stdout: BUILD_IOS.CONFIGURATION(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME),
      });
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run --verbose
     * Expected behavior: The CLI should print the verbose configuration
     */
    it('should properly handle --verbose option', async () => {
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--verbose'],
        stdout: [BUILD.VERBOSE],
      });
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run --debug/-d
     * Expected behavior: The CLI should print the debug configuration and execute correct tasks
     */
    it('should properly handle --debug option', async () => {
      const expectedOutput = [
        ...BUILD_IOS.BUILD_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Debug'),
        ...BUILD_IOS.PACKAGE_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Debug'),
        BUILD_IOS.BUILD_TYPE_DEBUG,
      ];
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--debug'],
        stdout: expectedOutput,
      });
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '-d'],
        stdout: expectedOutput,
      });
    });

    // release
    /**
     * Command: npx expo-brownfield build:ios --dry-run --debug/-d
     * Expected behavior: The CLI should print the debug configuration and execute correct tasks
     */
    it('should properly handle --release option', async () => {
      const expectedOutput = [
        ...BUILD_IOS.BUILD_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Release'),
        ...BUILD_IOS.PACKAGE_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Release'),
        BUILD_IOS.BUILD_TYPE_RELEASE,
      ];
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--release'],
        stdout: expectedOutput,
      });
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '-r'],
        stdout: expectedOutput,
      });
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run --release -d
     * Expected behavior: --release option should override --debug option
     */
    it('--release option should take precedence over --debug option', async () => {
      const expectedOutput = [
        ...BUILD_IOS.BUILD_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Release'),
        BUILD_IOS.BUILD_TYPE_RELEASE,
      ];
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--release', '-d', '-r', '--debug'],
        stdout: expectedOutput,
      });
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run -x/--xcworkspace someworkspace.xcworkspace
     * Expected behavior: The CLI should print the build configuration with the correct workspace
     */
    it('should properly handle --xcworkspace option', async () => {
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '-x', 'someworkspace.xcworkspace'],
        stdout: [`- Workspace: someworkspace.xcworkspace`],
      });
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--xcworkspace', 'someworkspace.xcworkspace'],
        stdout: [`- Workspace: someworkspace.xcworkspace`],
      });
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run -s/--scheme someworkspace.xcworkspace
     * Expected behavior: The CLI should print the build configuration with the correct workspace
     */
    it('should properly handle --xcworkspace option', async () => {
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '-s', 'somescheme'],
        stdout: [`- Scheme: somescheme`],
      });
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--scheme', 'somescheme'],
        stdout: [`- Scheme: somescheme`],
      });
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run -a/--artifacts ../artifacts
     * Expected behavior: The CLI should print the build configuration with the correct workspace
     */
    it('should properly handle --artifacts option', async () => {
      const expectedPath = path.join(TEMP_DIR_PREBUILD, '../artifacts');
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '-a', '../artifacts'],
        stdout: [`- Artifacts path: ${expectedPath}`],
      });
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--artifacts', '../artifacts'],
        stdout: [`- Artifacts path: ${expectedPath}`],
      });
    });

    it('should properly handle --package option', async () => {
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '-p', 'MyAppArtifacts'],
        stdout: [
          BUILD_IOS.PACKAGE_CREATION('MyAppArtifacts'),
          BUILD_IOS.PACKAGE_CONFIGURATION('MyAppArtifacts'),
        ],
      });
      await buildIosTest({
        directory: TEMP_DIR_PREBUILD,
        args: ['--dry-run', '--package', 'MyAppArtifacts'],
        stdout: [
          BUILD_IOS.PACKAGE_CREATION('MyAppArtifacts'),
          BUILD_IOS.PACKAGE_CONFIGURATION('MyAppArtifacts'),
        ],
      });
    });
  });
});
