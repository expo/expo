import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runTurboTasksAsync } from '../../Turbo';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { loadRequestedParcels } from './loadRequestedParcels';

/**
 * Restores or builds package-owned iOS XCFrameworks through Turbo. Tarball creation is left to
 * each package's prepack lifecycle, immediately before npm packs it.
 */
export const bundleIOSPrebuilds = new Task<TaskArgs>(
  {
    name: 'bundleIOSPrebuilds',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    if (options.skipIosPrebuilds) {
      logger.debug('\n📱 Skipping iOS precompile restoration due to --skip-ios-prebuilds.');
      return;
    }

    const packageNames = parcels
      .filter(
        (parcel) =>
          parcel.state.releaseVersion &&
          parcel.pkg.hasSwiftPMConfiguration() &&
          parcel.pkg.getSwiftPMConfiguration().publishPrebuilds === true
      )
      .map((parcel) => parcel.pkg.packageName);
    if (packageNames.length === 0) {
      logger.log('No iOS prebuild packages in publish set, skipping');
      return;
    }

    logger.log(`\n📱 Restoring iOS prebuilds for ${packageNames.length} package(s) with Turbo...`);
    // TODO: Fail publication on Turbo cache misses after the two-machine flow is proven.
    await runTurboTasksAsync(['precompile-ios'], { filters: packageNames });
  }
);
