import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';
import { getDeepDependenciesWarningAsync } from '../utils/explainDependencies';

export class IllegalPackageCheck implements DoctorCheck {
  description = 'Check that expo-permissions is not installed in SDK50';

  sdkVersionRange = '>=50.0.0';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    const illegalPackages = [
      'expo-permissions',
    ];

    // warn if these packages are installed at all
    const possibleWarnings = await Promise.all(
      illegalPackages.map((pkg) => getDeepDependenciesWarningAsync({ name: pkg }, projectRoot))
    );

    possibleWarnings.forEach((possibleWarning) => {
      if (possibleWarning) {
        issues.push(possibleWarning);
      }
    });

    return {
      isSuccessful: !issues.length,
      issues,
      advice: issues.length
        ? `Remove expo-permissions module ${learnMore(
            'https://github.com/expo/expo/issues/13970'
          )}`
        : undefined,
    };
  }
}
