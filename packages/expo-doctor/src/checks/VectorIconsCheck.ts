import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';
import { getDeepDependenciesWarningAsync } from '../utils/explainDependencies';

export class VectorIconsCheck implements DoctorCheck {
  description = 'Check that expo/vector-icons package is not installed';

  sdkVersionRange = '>=54.0.0';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    // Check if @expo/vector-icons is installed
    const vectorIconsWarning = await getDeepDependenciesWarningAsync(
      { name: '@expo/vector-icons' },
      projectRoot
    );

    const issues: string[] = [];
    if (vectorIconsWarning) {
      issues.push(
        `The package "@expo/vector-icons" is deprecated in favor of icon packages from https://github.com/oblador/react-native-vector-icons.`
      );
    }

    return {
      isSuccessful: !issues.length,
      issues,
      advice: issues.length
        ? [
            `Learn more about how to migrate: ${learnMore(
              'https://expo.fyi/migrating-from-expo-vector-icons'
            )}`,
          ]
        : [],
    };
  }
}
