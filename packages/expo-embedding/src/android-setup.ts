import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';

import {
  configureAndroidProject,
  prepareAndroidProject,
  androidDependenciesAreHoisted,
} from './android';
import {
  activityMigrationPreview,
  hostChangesPreview,
  planActivityMigration,
} from './android-activity';
import { approveHostConfiguration, planApplicationConfiguration } from './android-application';
import type { HostFileChange } from './android-host';
import { exists, writeGenerated } from './files';
import { runCommand } from './process';

type HostOptions = {
  project?: string;
  target?: string;
  'configure-host'?: boolean;
  'migrate-activity'?: string;
};

export async function prepareAndroid(
  root: string,
  options: HostOptions
): Promise<HostFileChange[]> {
  if (options.project || options.target)
    throw new Error(
      'Android currently supports the standard :app module. Omit --project and --target.'
    );
  await prepareAndroidProject(root);
  const activity = await planActivityMigration(root);
  const application = await planApplicationConfiguration(root, activity.changes);
  const changes = new Map<string, HostFileChange>();
  for (const change of [...activity.changes, ...application.changes])
    changes.set(change.path, change);
  if (activity.changes.length) process.stdout.write(activityMigrationPreview(activity));
  if (application.changes.length)
    process.stdout.write(
      `Configure ${application.applicationName} with ExpoApplicationDelegate composition:\n` +
        hostChangesPreview(root, application.changes)
    );
  await approveHostConfiguration(activity, application, {
    configureHost: options['configure-host'],
    migrate: options['migrate-activity'],
    ci: process.env.CI,
    interactive: Boolean(process.stdin.isTTY && process.stdout.isTTY),
    confirm: async () => {
      const prompt = createInterface({ input: process.stdin, output: process.stdout });
      try {
        const answer = await prompt.question(
          'Apply these Application, Activity and XML theme changes? [y/N] '
        );
        return /^(y|yes)$/i.test(answer.trim());
      } finally {
        prompt.close();
      }
    },
  });
  return [...changes.values()];
}

export async function hoistAndroidDependencies(root: string, frozen: boolean): Promise<void> {
  if (androidDependenciesAreHoisted(root)) return;
  if (frozen)
    throw new Error(
      'The locked Android workspace does not hoist Expo and React Native to the host root. Run init without --frozen-lockfile and commit the root lockfile.'
    );
  await runCommand('npm', ['dedupe'], { cwd: root });
  if (!androidDependenciesAreHoisted(root))
    throw new Error(
      'The host and expo/ resolve different Expo or React Native packages. Align their dependency declarations, run npm dedupe, and retry init.'
    );
}

export async function initializeAndroid(
  root: string,
  packageRoot: string,
  changes: HostFileChange[]
): Promise<void> {
  if (!androidDependenciesAreHoisted(root))
    throw new Error(
      'Installation produced nested Expo or React Native dependencies. Align the workspace manifests and rerun init.'
    );
  const metroConfig = join(root, 'expo/metro.config.js');
  if (!(await exists(metroConfig)))
    await writeGenerated(
      metroConfig,
      "const { getDefaultConfig } = require('expo/metro-config');\nmodule.exports = getDefaultConfig(__dirname);\n"
    );
  await configureAndroidProject(
    root,
    join(packageRoot, 'templates/android'),
    process.execPath,
    changes
  );
}
