import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class PackageJsonCheck implements DoctorCheck {
  description = 'Check package.json for common issues';

  sdkVersionRange = '*';

  async runAsync({ pkg, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    // ** check for node_modules/.bin refs in scripts (e.g., can't have "expo" or similar in scripts) **

    const nodeModulesBinPath = path.join(projectRoot, 'node_modules', '.bin');
    // might be in a monorepo and not have node_modules/.bin, so at least check for most problematic conflicts
    const bins = fs.existsSync(nodeModulesBinPath)
      ? fs.readdirSync(nodeModulesBinPath)
      : ['expo', 'react-native'];
    const binsThatExistInScripts = pkg.scripts ? bins.filter((value) => pkg.scripts[value]) : [];
    if (binsThatExistInScripts.length) {
      issues.push(
        `The following scripts in package.json conflict with the contents of node_modules/.bin: ${binsThatExistInScripts.join(
          ', '
        )}.` +
          (pkg.scripts?.['expo']
            ? ' This will cause conflicts with the Expo CLI and likely lead to build failures.'
            : '')
      );
    }

    // ** check for conflicts between package name and installed packages **

    const installedPackages = Object.keys(pkg.dependencies ?? {}).concat(
      Object.keys(pkg.devDependencies ?? {})
    );

    if (installedPackages.includes(pkg.name)) {
      issues.push(
        `The name in your package.json is set to "${pkg.name}", which conflicts with a dependency of the same name.`
      );
    }

    // ** check if the package.json contains react 19 and if an override is set for it. If an override is not set this can cause a runtime issue:
    // "Warning: Error: A React Element from an older version of React was rendered. This is not supported"
    //  **

    const reactVersion = pkg.dependencies?.react;
    const reactOverride = pkg.overrides?.react;

    if (
      reactVersion &&
      reactVersion.includes('19.') &&
      (!reactOverride || !reactOverride.includes('19.'))
    ) {
      issues.push(
        'React 19 is installed but no override is set for it in the package.json. To prevent runtime issues, please add the following override to your package.json:\n' +
          `\n"overrides": {\n` +
          `  "react": "${reactVersion}"\n` +
          `}\n` +
          `\nThis will ensure that react-native will always use the correct version of React.`
      );
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
    };
  }
}
