import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';
import { configExistsAsync, loadConfigAsync } from '../utils/metroConfigLoader';

export class MetroConfigCheck implements DoctorCheck {
  description = 'Check for issues with Metro config';

  sdkVersionRange = '>=46.0.0';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    // configuration check and companion functions adapted from:
    // https://github.com/expo/eas-cli/blob/main/packages/eas-cli/src/project/metroConfig.ts
    if (await configExistsAsync(projectRoot)) {
      const metroConfig = await loadConfigAsync(projectRoot);

      if (
        // This is a custom property that we inject to ensure cache invalidation between projects.
        !metroConfig.transformer.hasOwnProperty('_expoRelativeProjectRoot')
      ) {
        issues.push(
          'It looks like that you are using a custom metro.config.js that does not extend "expo/metro-config". This can lead to unexpected and hard to debug issues. ' +
            learnMore('https://docs.expo.dev/guides/customizing-metro/')
        );
      }
    }

    return {
      isSuccessful: !issues.length,
      issues,
      advice: issues.length ? [`Update your metro.config.js to extend "expo/metro-config".`] : [],
    };
  }
}
