import { learnMore } from '../utils/TerminalLink';
import { getDeepDependenciesWarningAsync } from '../utils/explainDependencies';
import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class IllegalPackageCheck implements DoctorCheck {
  description = 'Check that native modules do not use incompatible support packages';

  sdkVersionRange = '>=44.0.0';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    const illegalPackages = [
      '@unimodules/core',
      '@unimodules/react-native-adapter',
      'react-native-unimodules',
    ];

    // warn if these packages are installed at all
    const possibleWarnings = await Promise.all(
      illegalPackages.map(pkg => getDeepDependenciesWarningAsync({ name: pkg }, projectRoot))
    );

    possibleWarnings.forEach(possibleWarning => {
      if (possibleWarning) {
        issues.push(possibleWarning);
      }
    });

    return {
      isSuccessful: !issues.length,
      issues,
      advice: issues.length
        ? `Remove any 'unimodules' packages from your project. Learn more: ${learnMore(
            'https://expo.fyi/r/sdk-44-remove-unimodules'
          )}`
        : undefined,
    };
  }
}
