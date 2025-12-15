import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { getDeepDependenciesWarningAsync } from '../utils/explainDependencies';

export class GlobalPackageInstalledLocallyCheck implements DoctorCheck {
  description = 'Check for legacy global CLI installed locally';

  sdkVersionRange = '>=46.0.0';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    let warning = await getDeepDependenciesWarningAsync({ name: 'expo-cli' }, projectRoot);
    if (warning) {
      issues.push(
        `Expo CLI is now part of the expo package. Having expo-cli in your project dependencies may cause issues, such as “error: unknown option --fix” when running npx expo install --fix`
      );
      advice.push(`Remove expo-cli from your project dependencies.`);
    }

    warning = await getDeepDependenciesWarningAsync({ name: 'eas-cli' }, projectRoot);
    if (warning) {
      issues.push(
        `EAS CLI should not be installed in your project. Instead, install it globally or use "npx", "pnpx", or "bunx" depending on your preferred package manager.`
      );
      advice.push(`Remove eas-cli from your project dependencies.`);
    }

    return {
      isSuccessful: !issues.length,
      issues,
      advice,
    };
  }
}
