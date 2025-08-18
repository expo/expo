import chalk from 'chalk';
import inquirer from 'inquirer';
import * as semver from 'semver';

import {
  createParcelAsync,
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
import { CommandOptions, Parcel, ReleaseType, TaskArgs } from '../types';

const { green, cyan } = chalk;

let lastAction: string | undefined;
let lastVersionIndex: number = 0;

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
    const parcelsToSelect = new Set<Parcel>(
      options.templatesOnly
        ? parcels.filter((p) => p.pkg.packageName !== 'expo-template-bare-minimum')
        : parcels
    );

    // A set of parcels selected to publish which will be passed to the next task.
    const parcelsToPublish = new Set<Parcel>();

    // Fast-path: auto-select packages whose current package.json version has not been published yet.
    if (options.autoSelectUnpublished && !process.env.CI) {
      const candidates: Parcel[] = [];

      for (const parcel of parcelsToSelect) {
        const currentVersion = parcel.pkg.packageVersion;
        const publishedVersions = parcel.pkgView?.versions ?? [];
        const isUnpublishedVersion = !publishedVersions.includes(currentVersion);

        // If the package was never published (pkgView is null) or the current version is not published yet.
        if (parcel.pkgView === null || isUnpublishedVersion) {
          candidates.push(parcel);
        }
      }

      if (candidates.length > 0) {
        // Resolve target release versions up-front to show in the checklist.
        const resolvedVersions = new Map<Parcel, string>();
        for (const parcel of candidates) {
          const { releaseVersion } = await resolveReleaseTypeAndVersion(parcel, options);
          resolvedVersions.set(parcel, releaseVersion);
        }

        const { selectedParcels } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedParcels',
            message:
              'Auto-selected packages whose current version is not published yet. Deselect any you do not want to publish:',
            choices: candidates.map((p) => {
              const name = p.pkg.packageName;
              const current = p.pkg.packageVersion;
              const target = resolvedVersions.get(p) ?? current;
              return {
                name: `${green(name)} (${cyan(target)})`,
                value: p,
                checked: true,
              };
            }),
            pageSize: Math.min(20, candidates.length + 2),
          },
        ]);

        // Apply selections
        for (const parcel of candidates) {
          if (selectedParcels.includes(parcel)) {
            parcel.state.releaseVersion = resolvedVersions.get(parcel) ?? parcel.pkg.packageVersion;
            parcelsToPublish.add(parcel);
          } else {
            parcel.state.releaseVersion = null;
          }
        }

        // Cleanup: remove non-selected parcels from dependency sets of others in this run
        for (const parcel of parcelsToSelect) {
          if (!parcelsToPublish.has(parcel)) {
            parcel.dependents.forEach((dependent) => {
              dependent.dependencies.delete(parcel);
            });
          }
        }
      }
    }

    // This call mutates `parcelsToPublish` set, adding the selected parcels.
    await selectParcelsToPublish(parcelsToSelect, parcelsToPublish, options);

    // A set of graph nodes representing the dependents of the selected packages.
    const dependentNodes = new Set<PackagesGraphNode>(
      parcels
        .filter((parcel) => parcel.state.isRequested && parcelsToPublish.has(parcel))
        .map((parcel) => parcel.graphNode.getAllDependents())
        .flat()
        // If templates-only, do not suggest dependents since we are restricting to templates
        .filter((node) => !options.templatesOnly || node.pkg.isTemplate())
    );

    // From the dependents select these that should be published too.
    const selectedDependentNodes = options.templatesOnly
      ? []
      : await promptForDependentNodes([...dependentNodes]);

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

    // Enforce publishing expo-template-bare-minimum if expo is selected.
    const expoParcel = [...parcelsToPublish].find((parcel) => parcel.pkg.packageName === 'expo');
    const isBareTemplateSelected =
      [...parcelsToPublish].find(
        (node) => node.pkg.packageName === 'expo-template-bare-minimum'
      ) !== undefined;
    if (!options.templatesOnly && expoParcel && !isBareTemplateSelected) {
      const bareTemplateNode = [...dependentNodes].find(
        (node) => node.pkg.packageName === 'expo-template-bare-minimum'
      )!;
      const templateParcel = await createParcelAsync(bareTemplateNode);

      // Template don't not have changelog so we need to match Expo's release type.
      const newExpoVersion = expoParcel.state.releaseVersion || '';
      templateParcel.minReleaseType =
        semver.minor(newExpoVersion) === 0 &&
        semver.patch(newExpoVersion) === 0 &&
        !semver.prerelease(newExpoVersion)
          ? ReleaseType.MAJOR
          : ReleaseType.PATCH;
      const { releaseVersion } = await resolveReleaseTypeAndVersion(templateParcel, options);

      parcelsToPublish.add(templateParcel);
      logger.log(
        `📦 ${green('expo-template-bare-minimum')} is required to be published with ${green(
          'expo'
        )} package, will be published as ${cyan.bold(releaseVersion)}.`
      );
    }

    return [[...parcelsToPublish], options];
  }
);

/**
 * Prompts the user to confirm whether the package should be published.
 * It immediately returns `true` if it's run on the CI.
 */
async function promptToPublishParcel(
  parcel: Parcel,
  options: CommandOptions,
  index: number
): Promise<boolean | 'back' | 'skip'> {
  const customVersionId = 'custom-version';
  const packageName = parcel.pkg.packageName;
  const { releaseVersion, explainer } = await resolveReleaseTypeAndVersion(parcel, options);

  if (process.env.CI) {
    parcel.state.releaseVersion = releaseVersion;
    return true;
  }

  const choices = [
    {
      name: 'Yes',
      value: 'yes',
    },
    {
      name: 'Show more options',
      value: 'no',
    },
    {
      name: 'Skip to next package',
      value: 'skip',
    },
  ];

  // Only add back option if we're not on the first package
  if (index > 0) {
    choices.push({
      name: 'Go back to previous package',
      value: 'back',
    });
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `Do you want to publish ${green.bold(packageName)} as ${cyan.bold(releaseVersion)}?${explainer ? `\n${explainer}` : ''}`,
      choices,
      default: lastAction || 'yes',
    },
  ]);

  // Store the selected action for next time
  lastAction = action;

  if (action === 'yes') {
    parcel.state.releaseVersion = releaseVersion;
    return true;
  }
  if (action === 'skip') {
    return 'skip';
  }
  if (action === 'back') {
    return 'back';
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
        {
          name: "Don't publish",
          value: null,
        },
        ...(index > 0
          ? [
              {
                name: 'Go back to previous package',
                value: 'back',
              },
            ]
          : []),
        {
          name: 'Skip to next package',
          value: 'skip',
        },
      ],
      default: lastVersionIndex,
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

  if (version === 'back') {
    return 'back';
  }
  if (version === 'skip') {
    return 'skip';
  }

  if (customVersion || version) {
    parcel.state.releaseVersion = customVersion ?? version;
    // Store the index of the selected version
    if (version && !customVersion) {
      lastVersionIndex = suggestedVersions.indexOf(version);
    }
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
  const parcelsArray = Array.from(parcelsToSelect);
  const skipped = new Set<string>();
  let currentIndex = 0;

  while (currentIndex >= 0 && currentIndex < parcelsArray.length) {
    const parcel = parcelsArray[currentIndex];
    const packageName = parcel.pkg.packageName;

    if (
      !(parcel.state.releaseVersion === null || parcel.state.releaseVersion === undefined) ||
      skipped.has(packageName) ||
      !isParcelUnpublished(parcel)
    ) {
      // Skip prompting if a release version is already set (chosen version or explicitly null)
      // or if the user previously chose to skip this package.
      // Also skip if all changes to the package have already been published previously.
      currentIndex++;
      continue;
    }

    printPackageParcel(parcel);
    const result = await promptToPublishParcel(parcel, options, currentIndex);

    if (result === 'back') {
      let prevPromptableIndex = -1;
      // Search backwards for the first unpublished package
      for (let j = currentIndex - 1; j >= 0; j--) {
        if (isParcelUnpublished(parcelsArray[j])) {
          prevPromptableIndex = j;
          break;
        }
      }

      if (prevPromptableIndex !== -1) {
        // Reset state for ALL packages from target up to current (inclusive)
        for (let k = prevPromptableIndex; k <= currentIndex; k++) {
          const p = parcelsArray[k];
          p.state.releaseVersion = null;
          selectedParcels.delete(p);
          skipped.delete(p.pkg.packageName);
        }

        currentIndex = prevPromptableIndex; // Jump to the target index
        continue; // Re-process the target package
      } else {
        currentIndex++; // Prevent getting stuck if no previous target
      }
    } else if (result === 'skip') {
      skipped.add(packageName);
      parcel.state.releaseVersion = null;
      selectedParcels.delete(parcel);
      currentIndex++;
    } else if (result === true) {
      // Selected "Yes"
      selectedParcels.add(parcel);
      skipped.delete(packageName);
      currentIndex++;
    } else {
      // Selected "Don't Publish" or null
      parcel.state.releaseVersion = null;
      selectedParcels.delete(parcel);
      skipped.delete(packageName);
      currentIndex++;
    }
  }

  // Final cleanup: If a parcel wasn't selected for publishing, remove it from the
  // dependency lists of other packages considered in this run. This ensures that
  // subsequent steps operate only on dependencies that are being published together.
  for (const parcel of parcelsArray) {
    if (!selectedParcels.has(parcel)) {
      parcel.dependents.forEach((dependent) => {
        dependent.dependencies.delete(parcel);
      });
    }
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
