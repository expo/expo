import type { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class ExpoRouterReactNavigationCheck implements DoctorCheck {
  description = 'Check that @react-navigation packages are not installed alongside expo-router';

  sdkVersionRange = '>=56.0.0 <57.0.0';

  async runAsync({ pkg }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const hasExpoRouter = !!(
      pkg.dependencies?.['expo-router'] || pkg.devDependencies?.['expo-router']
    );
    if (!hasExpoRouter) {
      return { isSuccessful: true, issues: [], advice: [] };
    }

    const reactNavigationDeps = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]
      .filter((name) => name.startsWith('@react-navigation/'))
      .filter((name, index, all) => all.indexOf(name) === index)
      .sort();

    if (reactNavigationDeps.length === 0) {
      return { isSuccessful: true, issues: [], advice: [] };
    }

    const list = reactNavigationDeps.map((n) => `"${n}"`).join(', ');

    return {
      isSuccessful: false,
      issues: [
        `As of SDK 56, expo-router is no longer compatible with react-navigation. The following @react-navigation packages are installed as direct dependencies and should be removed: ${list}.`,
      ],
      advice: [
        `Remove these packages from your package.json and replace any direct \`@react-navigation/*\` imports in your code with their expo-router equivalents. See https://docs.expo.dev/router/migrate/sdk-55-to-56/ for more information.`,
      ],
    };
  }
}
