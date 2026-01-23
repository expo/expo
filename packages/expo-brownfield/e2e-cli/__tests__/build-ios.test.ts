import path from 'path';

import { BUILD, BUILD_IOS, ERROR, HELP_MESSAGE } from '../utils/output';
import { executeCommandAsync } from '../utils/process';
import { cleanUpProject, createTempProject } from '../utils/project';
import { buildIosTest, expectPrebuild } from '../utils/test';

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
    it('should display help message for --help/-h option', async () => {
      // Help message display shouldn't require prebuild
      await buildIosTest(TEMP_DIR, ['--help'], true, [HELP_MESSAGE.BUILD_IOS]);
      await buildIosTest(TEMP_DIR, ['-h'], true, [HELP_MESSAGE.BUILD_IOS]);
    });

    /**
     * Command: npx expo-brownfield build:ios --invalid-flag
     * Expected behavior: The CLI should display the error message
     */
    it('should handle incorrect options', async () => {
      await buildIosTest(
        TEMP_DIR,
        ['--invalid-flag'],
        false,
        [],
        [ERROR.UNKNOWN_OPTION('--invalid-flag')]
      );
    });

    /**
     * Command: npx expo-brownfield build:ios build:android
     * Expected behavior: The CLI should display the error message
     */
    it("shouldn't allow passing another command", async () => {
      await buildIosTest(
        TEMP_DIR,
        ['build:android'],
        false,
        [],
        [ERROR.ADDITIONAL_COMMAND('build:ios')]
      );
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
        ['-c', 'yes | npx expo-brownfield build:ios'],
        { ignoreErrors: true }
      );
      expect(exitCode).not.toBe(0);
      expect(stdout).toContain(BUILD.PREBUILD_WARNING('ios'));
      expect(stdout).toContain(BUILD.PREBUILD_PROMPT);
      // TODO(pmleczek): Refactor CLI error handling
      expect(stderr).toContain(`Error: Value of iOS Scheme`);
      expect(stderr).toContain(`could not be inferred from the project`);

      // The android directory should be created and not empty
      await expectPrebuild(TEMP_DIR, 'ios');
    });

    // TODO(pmleczek): Verify failure if prebuild is not done
  });

  /**
   * Part of the cases should require prebuild to be done
   */
  describe('with prebuild', () => {
    beforeAll(async () => {
      TEMP_DIR_PREBUILD = await createTempProject('buildiospb', true);
    }, 600000);

    afterAll(async () => {
      await cleanUpProject('buildiospb');
    }, 600000);

    /**
     * Command: npx expo-brownfield build:ios --dry-run
     * Expected behavior: The CLI should print the steps it would execute
     */
    it('should build the project', async () => {
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run'], true, [
        BUILD_IOS.ARTIFACT_CLEANUP,
        ...BUILD_IOS.BUILD_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Release'),
        ...BUILD_IOS.PACKAGE_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Release'),
        BUILD_IOS.HERMES_COPYING,
      ]);
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run
     * Expected behavior: The CLI should print the inferred build configuration
     */
    it('should infer and print build configuration', async () => {
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run'], true, [
        BUILD_IOS.CONFIGURATION(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME),
      ]);
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run --verbose
     * Expected behavior: The CLI should print the verbose configuration
     */
    it('should properly handle --verbose option', async () => {
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run', '--verbose'], true, [BUILD.VERBOSE]);
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run --debug/-d
     * Expected behavior: The CLI should print the debug configuration and execute correct tasks
     */
    it('should properly handle --debug option', async () => {
      const expectedOutput = [
        ...BUILD_IOS.BUILD_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Debug'),
        ...BUILD_IOS.PACKAGE_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Debug'),
        BUILD.BUILD_TYPE_DEBUG,
      ];
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run', '--debug'], true, expectedOutput);
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run', '-d'], true, expectedOutput);
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
        BUILD.BUILD_TYPE_RELEASE,
      ];
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run', '--release'], true, expectedOutput);
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run', '-r'], true, expectedOutput);
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run --release -d
     * Expected behavior: --release option should override --debug option
     */
    it('--release option should take precedence over --debug option', async () => {
      const expectedOutput = [
        ...BUILD_IOS.BUILD_COMMAND(TEMP_DIR_PREBUILD, PREBUILD_WORKSPACE_NAME, 'Release'),
        BUILD.BUILD_TYPE_RELEASE,
      ];
      await buildIosTest(
        TEMP_DIR_PREBUILD,
        ['--dry-run', '--release', '-d', '-r', '--debug'],
        true,
        expectedOutput
      );
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run -x/--xcworkspace someworkspace.xcworkspace
     * Expected behavior: The CLI should print the build configuration with the correct workspace
     */
    it('should properly handle --xcworkspace option', async () => {
      await buildIosTest(
        TEMP_DIR_PREBUILD,
        ['--dry-run', '-x', 'someworkspace.xcworkspace'],
        true,
        [`- Xcode Workspace: someworkspace.xcworkspace`]
      );
      await buildIosTest(
        TEMP_DIR_PREBUILD,
        ['--dry-run', '--xcworkspace', 'someworkspace.xcworkspace'],
        true,
        [`- Xcode Workspace: someworkspace.xcworkspace`]
      );
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run -s/--scheme someworkspace.xcworkspace
     * Expected behavior: The CLI should print the build configuration with the correct workspace
     */
    it('should properly handle --xcworkspace option', async () => {
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run', '-s', 'somescheme'], true, [
        `- Xcode Scheme: somescheme`,
      ]);
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run', '--scheme', 'somescheme'], true, [
        `- Xcode Scheme: somescheme`,
      ]);
    });

    /**
     * Command: npx expo-brownfield build:ios --dry-run -s/--scheme someworkspace.xcworkspace
     * Expected behavior: The CLI should print the build configuration with the correct workspace
     */
    it('should properly handle --artifacts option', async () => {
      const expectedPath = path.join(TEMP_DIR_PREBUILD, '../artifacts');
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run', '-a', '../artifacts'], true, [
        `- Artifacts directory: ${expectedPath}`,
      ]);
      await buildIosTest(TEMP_DIR_PREBUILD, ['--dry-run', '--artifacts', '../artifacts'], true, [
        `- Artifacts directory: ${expectedPath}`,
      ]);
    });
  });
});
