import chalk from 'chalk';

import * as Changelogs from '../../Changelogs';
import Git from '../../Git';
import { getListOfPackagesAsync, Package } from '../../Packages';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { PackagesGraph, PackagesGraphNode } from '../../packages-graph';
import { getMinReleaseType, getPackageGitLogsAsync } from '../helpers';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green } = chalk;
const parcelsCache = new Map<PackagesGraphNode, Parcel>();

/**
 * Gets a list of public packages in the monorepo and wraps them into parcels.
 * If only a subset of packages were requested, it also includes all their dependencies.
 */
export const loadRequestedParcels = new Task<TaskArgs>(
  {
    name: 'loadRequestedParcels',
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const { packageNames } = options;

    const allPackages = await runWithSpinner(
      'Loading requested workspace packages',
      () => getListOfPackagesAsync(),
      'Loaded requested workspace packages'
    );

    const graph = new PackagesGraph(allPackages);
    const allPackagesObj = allPackages.reduce((acc, pkg) => {
      acc[pkg.packageName] = pkg;
      return acc;
    }, {});

    // Verify that provided package names are valid.
    for (const packageName of packageNames) {
      if (!allPackagesObj[packageName]) {
        throw new Error(`Package with provided name ${green(packageName)} does not exist.`);
      }
    }

    const filteredPackages = allPackages.filter((pkg) => {
      const isPrivate = pkg.packageJson.private;
      const isIncluded = packageNames.length === 0 || packageNames.includes(pkg.packageName);
      return !isPrivate && isIncluded;
    });

    // Create parcels only for requested packages (or all if none was provided).
    const { requestedParcels, dependenciesParcels } = await runWithSpinner(
      'Collecting changes in the packages and their dependencies',
      async () => {
        const requestedParcels = await createParcelsForPackages(filteredPackages, graph);

        requestedParcels.forEach((parcel) => {
          parcel.state.isRequested = true;
        });

        // Include dependencies if only some specific packages were requested.
        const dependenciesParcels =
          options.deps && packageNames.length > 0
            ? await createParcelsForDependenciesOf(requestedParcels)
            : new Set<Parcel>();

        return { requestedParcels, dependenciesParcels };
      },
      'Collected changes in the packages and their dependencies'
    );

    // A set of all parcels to select to publish.
    // The dependencies must precede the requested ones to select them first.
    const parcelsToSelect = new Set<Parcel>([...dependenciesParcels, ...requestedParcels]);

    return [[...parcelsToSelect], options];
  }
);

/**
 * Gets the parcel of the provided node from cache, or creates a new one when not found.
 */
export async function getCachedParcel(node: PackagesGraphNode): Promise<Parcel> {
  const cachedPromise = parcelsCache.get(node);

  if (cachedPromise) {
    return cachedPromise;
  }
  const newParcel = await createParcelAsync(node);
  parcelsCache.set(node, newParcel);
  return newParcel;
}

export async function createParcelsForPackages(
  packages: Package[],
  graph: PackagesGraph
): Promise<Set<Parcel>> {
  const nodes = packages
    .map((pkg) => graph.getNode(pkg.packageName))
    .filter(Boolean) as PackagesGraphNode[];

  return await createParcelsForGraphNodes(nodes);
}

export async function createParcelsForGraphNodes(nodes: PackagesGraphNode[]): Promise<Set<Parcel>> {
  const parcels = await Promise.all(nodes.map((node) => getCachedParcel(node)));
  return new Set<Parcel>(parcels);
}

export async function createParcelsForDependenciesOf(parcels: Set<Parcel>): Promise<Set<Parcel>> {
  // A set of parcels that will precede the requested ones, which consist of their dependencies.
  const allDependencies = new Set<Parcel>();

  for (const parcel of parcels) {
    // Add all dependencies of the current package.
    const dependencies = await createParcelsForGraphNodes(parcel.graphNode.getAllDependencies());

    for (const dependencyParcel of dependencies) {
      parcel.dependencies.add(dependencyParcel);
      dependencyParcel.dependents.add(parcel);

      allDependencies.add(dependencyParcel);
    }
  }
  return new Set<Parcel>([...allDependencies, ...parcels]);
}

/**
 * Wraps `Package` object into a parcels - convenient wrapper providing more package-related helpers.
 * As part of creating the parcel, it loads the latest manifest from npm, loads the changelog and git logs.
 */
export async function createParcelAsync(packageNode: PackagesGraphNode): Promise<Parcel> {
  const { pkg } = packageNode;
  const pkgView = await pkg.getPackageViewAsync();
  const changelog = Changelogs.loadFrom(pkg.changelogPath);
  const gitDir = new Git.Directory(pkg.path);
  const changelogChanges = await changelog.getChangesAsync();
  const logs = await getPackageGitLogsAsync(gitDir, pkgView?.gitHead);

  return {
    pkg,
    pkgView,
    changelog,
    gitDir,
    graphNode: packageNode,
    dependents: new Set<Parcel>(),
    dependencies: new Set<Parcel>(),
    logs,
    changelogChanges,
    minReleaseType: getMinReleaseType(changelogChanges),
    state: {},
  };
}
