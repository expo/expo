import { PackageJSONConfig } from '@expo/config';
import fs from 'fs';
import { resolveWorkspaceRoot } from 'resolve-workspace-root';

import { DoctorMultiCheck, DoctorMultiCheckItemBase } from './DoctorMultiCheck';
import { DoctorCheckParams, DoctorCheckResult } from './checks.types';

export type TrustedDependencyCheckItem = { packageName: string } & DoctorMultiCheckItemBase;

/**
 * Packages that require postinstall scripts and need to be explicitly trusted
 * when using bun or pnpm. Each entry specifies the package name and the SDK
 * version range where this check applies.
 */
export const trustedDependencyCheckItems: TrustedDependencyCheckItem[] = [
  {
    packageName: '@shopify/react-native-skia',
    getMessage: (packageName: string) =>
      `The package "${packageName}" requires a postinstall script to function correctly.`,
    sdkVersionRange: '>=55.0.0',
  },
];

export class TrustedDependencyCheck extends DoctorMultiCheck<TrustedDependencyCheckItem> {
  description = 'Check that dependencies with postinstall scripts are configured for bun/pnpm';

  sdkVersionRange = '*';

  checkItems = trustedDependencyCheckItems;

  protected async runAsyncInner(
    { pkg, projectRoot }: DoctorCheckParams,
    checkItems: TrustedDependencyCheckItem[]
  ): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const advice: string[] = [];

    // Find which packages from our check list are actually installed
    const installedPackages = checkItems.filter(
      (item) =>
        pkg.dependencies?.[item.packageName] !== undefined ||
        pkg.devDependencies?.[item.packageName] !== undefined
    );

    if (installedPackages.length === 0) {
      return { isSuccessful: true, issues, advice };
    }

    const root = resolveWorkspaceRoot(projectRoot) ?? projectRoot;
    const hasBunLockfile = fs.existsSync(`${root}/bun.lockb`) || fs.existsSync(`${root}/bun.lock`);
    const hasPnpmLockfile = fs.existsSync(`${root}/pnpm-lock.yaml`);

    if (hasBunLockfile) {
      const result = this.checkBunTrustedDependencies(pkg, installedPackages);
      issues.push(...result.issues);
      advice.push(...result.advice);
    }

    if (hasPnpmLockfile) {
      const result = this.checkPnpmOnlyBuiltDependencies(pkg, installedPackages);
      issues.push(...result.issues);
      advice.push(...result.advice);
    }

    return { isSuccessful: issues.length === 0, issues, advice };
  }

  private checkBunTrustedDependencies(
    pkg: PackageJSONConfig,
    installedPackages: TrustedDependencyCheckItem[]
  ): { issues: string[]; advice: string[] } {
    const issues: string[] = [];
    const advice: string[] = [];
    const trustedDependencies: string[] = (pkg as any).trustedDependencies ?? [];

    const missingPackages = installedPackages.filter(
      (item) => !trustedDependencies.includes(item.packageName)
    );

    for (const item of missingPackages) {
      issues.push(
        `${item.getMessage(item.packageName)} ` +
          `It is not listed in trustedDependencies, which is required for bun to run the postinstall script.`
      );
    }

    if (missingPackages.length > 0) {
      const packageList = missingPackages.map((item) => item.packageName).join(' ');
      advice.push(
        `Run the following to trust the package and re-run its postinstall script:\n\nbun pm trust ${packageList}`
      );
    }

    return { issues, advice };
  }

  private checkPnpmOnlyBuiltDependencies(
    pkg: PackageJSONConfig,
    installedPackages: TrustedDependencyCheckItem[]
  ): { issues: string[]; advice: string[] } {
    const issues: string[] = [];
    const advice: string[] = [];
    const onlyBuiltDependencies: string[] = (pkg as any).pnpm?.onlyBuiltDependencies ?? [];

    const missingPackages = installedPackages.filter(
      (item) => !onlyBuiltDependencies.includes(item.packageName)
    );

    for (const item of missingPackages) {
      issues.push(
        `${item.getMessage(item.packageName)} ` +
          `It is not listed in pnpm.onlyBuiltDependencies, which is required for pnpm v10+ to run the postinstall script.`
      );
    }

    if (missingPackages.length > 0) {
      const packageList = missingPackages.map((item) => `"${item.packageName}"`).join(',\n    ');
      advice.push(
        `Add the following to "pnpm.onlyBuiltDependencies" in your package.json:\n\n` +
          `"pnpm": {\n  "onlyBuiltDependencies": [\n    ${packageList}\n  ]\n}\n\n` +
          `Then run "pnpm install" to re-run the postinstall script.`
      );
    }

    return { issues, advice };
  }
}
