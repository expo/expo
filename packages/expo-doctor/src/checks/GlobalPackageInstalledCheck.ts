import { getDeepDependenciesWarningAsync } from '../utils/explainDependencies';
import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class GlobalPackageInstalledCheck implements DoctorCheck {
  description = 'Check for legacy global CLI installed locally';

  sdkVersionRange = '>=46.0.0';

  async runAsync({ projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    const warning = await getDeepDependenciesWarningAsync({ name: 'expo-cli' }, projectRoot);
    if (warning) {
      issues.push(
        `Expo CLI is now part of the expo package. Having expo-cli in your project dependencies may cause issues, such as “error: unknown option --fix” when running npx expo install --fix`
      );
      advice.push(`Remove expo-cli from your project dependencies.`);
    }

    return {
      isSuccessful: !issues.length,
      issues,
      advice: issues.length ? `Remove expo-cli from your project dependencies.` : undefined,
    };
  }
}
