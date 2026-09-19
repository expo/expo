import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runTurboTasksAsync } from '../../Turbo';
import type { CommandOptions, Parcel, TaskArgs } from '../types';
import { updateAndroidProjects } from './updateAndroidProjects';

/**
 * Restores or builds package-owned Android Maven repositories through Turbo. Each package's
 * prepack lifecycle stages the repository immediately before npm packs it; publication
 * coordinates remain committed in expo-module.config.json.
 */
export const publishAndroidArtifacts = new Task<TaskArgs>(
  {
    name: 'publishAndroidArtifacts',
    dependsOn: [updateAndroidProjects],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    if (options.templatesOnly) {
      logger.log('\n🤖 Skipping Android precompiles (templates-only).');
      return;
    }
    if (options.skipAndroidArtifacts) {
      logger.log('\n🤖 Skipping Android precompiles.');
      return;
    }

    const packageNames = parcels
      .filter(({ pkg, state }) => state.releaseVersion && pkg.scripts['precompile-android'])
      .map(({ pkg }) => pkg.packageName);
    if (packageNames.length === 0) {
      logger.log('\n🤖 No Android precompile packages in publish set, skipping.');
      return;
    }

    logger.log(
      `\n🤖 Restoring Android precompiles for ${packageNames.length} package(s) with Turbo...`
    );
    await runTurboTasksAsync(['precompile-android'], { filters: packageNames });
  }
);
