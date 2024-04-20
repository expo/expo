import chalk from 'chalk';
import inquirer from 'inquirer';

import {
  createParcelsForDependenciesOf,
  createParcelsForGraphNodes,
  loadRequestedParcels,
} from './loadRequestedParcels';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { PackagesGraphNode } from '../../packages-graph';
import {
  getSuggestedVersions,
  isParcelUnpublished,
  printPackageParcel,
  resolveReleaseTypeAndVersion,
  validateVersion,
} from '../helpers';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green, cyan } = chalk;

/**
 * Prompts which suggested packages are going to be published.
 */
export const selectPackagesToPublish = new Task<TaskArgs>(
  {
    name: 'selectPackagesToPublish',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    // Skip this task for canary releases
    if (options.canary) {
      return;
    }

    // A set of parcels to prompt for.
    const parcelsToSelect = new Set<Parcel>(parcels);

    // A set of parcels selected to publish which will be passed to the next task.
    const parcelsToPublish = new Set<Parcel>();

    // This call mutates `parcelsToPublish` set, adding the selected parcels.
    await selectParcelsToPublish(parcelsToSelect, parcelsToPublish, options);

    // A set of graph nodes representing the dependents of the selected packages.
    const dependentNodes = new Set<PackagesGraphNode>(
      parcels
        .filter((parcel) => parcel.state.isRequested && parcelsToPublish.has(parcel))
        .map((parcel) => parcel.graphNode.getAllDependents())
        .flat()
    );

    // From the dependents select these that should be published too.
    const selectedDependentNodes = await promptForDependentNodes([...dependentNodes]);

    logger.log();

    if (selectedDependentNodes.length > 0) {
      const selectedDependentsParcels = await runWithSpinner(
        'Collecting changes in the dependent packages',
        async () => {
          const dependents = await createParcelsForGraphNodes(selectedDependentNodes);
          const dependencies = await createParcelsForDependenciesOf(dependents);

          // The dependencies must precede the dependents to select them first.
          return new Set<Parcel>([...dependencies, ...dependents]);
        },
        'Collected changes in the dependent packages'
      );

      // Prompt for more packages: dependents and their dependencies.
      // This call mutates `parcelsToPublish` set, adding the selected parcels.
      await selectParcelsToPublish(selectedDependentsParcels, parcelsToPublish, options);
    }

    if (parcelsToPublish.size === 0) {
      logger.success('🤷‍♂️ There is nothing to be published.');
      return Task.STOP;
    }
    return [[...parcelsToPublish], options];
  }
);

/**
 * Prompts the user to confirm whether the package should be published.
 * It immediately returns `true` if it's run on the CI.
 */
async function promptToPublishParcel(parcel: Parcel, options: CommandOptions): Promise<boolean> {
  const customVersionId = 'custom-version';
  const packageName = parcel.pkg.packageName;
  const releaseVersion = resolveReleaseTypeAndVersion(parcel, options);

  if (process.env.CI) {
    parcel.state.releaseVersion = releaseVersion;
    return true;
  }

  const { selected } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'selected',
      message: `Do you want to publish ${green.bold(packageName)} as ${cyan.bold(releaseVersion)}?`,
      default: true,
    },
  ]);

  if (selected) {
    parcel.state.releaseVersion = releaseVersion;
    return true;
  }

  const suggestedVersions = getSuggestedVersions(
    parcel.pkg.packageVersion,
    parcel.pkgView?.versions ?? [],
    options.prerelease === true ? 'rc' : options.prerelease || null
  );
  const { version, customVersion } = await inquirer.prompt([
    {
      type: 'list',
      name: 'version',
      message: `What do you want to do with ${green.bold(packageName)}?`,
      choices: [
        {
          name: "Don't publish",
          value: null,
        },
        ...suggestedVersions.map((version) => {
          return {
            name: `Publish as ${cyan.bold(version)}`,
            value: version,
          };
        }),
        {
          name: 'Publish as custom version',
          value: customVersionId,
        },
      ],
      validate: validateVersion(parcel),
    },
    {
      type: 'input',
      name: 'customVersion',
      message: 'Type in custom version to publish:',
      when(answers: Record<string, string>): boolean {
        return answers.version === customVersionId;
      },
      validate: validateVersion(parcel),
    },
  ]);

  if (customVersion || version) {
    parcel.state.releaseVersion = customVersion ?? version;
    return true;
  }
  parcel.state.releaseVersion = null;
  return false;
}

/**
 * Prints details about each parcel and asks whether to select the package to be published.
 * Mutates `selectedParcels` argument.
 */
async function selectParcelsToPublish(
  parcelsToSelect: Set<Parcel>,
  selectedParcels: Set<Parcel>,
  options: CommandOptions
): Promise<Set<Parcel>> {
  for (const parcel of parcelsToSelect) {
    // Since this function can be run multiple times (we're resolving dependents dependencies too),
    // the parcel could already be selected or rejected.
    const wasAlreadyAsked = parcel.state.releaseVersion != null || selectedParcels.has(parcel);

    if (!wasAlreadyAsked && isParcelUnpublished(parcel)) {
      printPackageParcel(parcel);

      if (await promptToPublishParcel(parcel, options)) {
        selectedParcels.add(parcel);
        continue;
      }
    }
    // Remove the package from dependent's dependencies if it's not going to be published.
    // Dependents are always prompted at the end, thus it can work properly.
    parcel.dependents.forEach((dependent) => {
      dependent.dependencies.delete(parcel);
    });
  }
  return selectedParcels;
}

/**
 * Asks whether to publish the dependents of the requested packages.
 */
async function promptForDependentNodes(nodes: PackagesGraphNode[]): Promise<PackagesGraphNode[]> {
  if (nodes.length === 0) {
    return [];
  }
  const { dependents } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'dependents',
      message: `Found some dependents that you may want to publish as well, select which ones:\n`,
      choices: nodes.map((node) => {
        return {
          name: node.name,
          value: node,
          // `expo` package is the one we often want to publish as a dependent,
          // so make it checked by default.
          checked: node.name === 'expo',
        };
      }),
    },
  ]);
  return dependents;
}
