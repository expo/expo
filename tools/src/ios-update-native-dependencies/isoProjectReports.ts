import spawnAsync, { SpawnResult } from '@expo/spawn-async';
import { pathExists, readJSON, unlink, writeJSON } from 'fs-extra';
import glob from 'glob-promise';
import path from 'path';

import { Podfile, PodfileTargetDefinition, readPodfileAsync } from '../CocoaPods';
import { withSpinner } from '../Decorators';
import * as Directories from '../Directories';
import logger from '../Logger';
import { getListOfPackagesAsync } from '../Packages';

export interface PodTaskOptions {
  clearCache: boolean;
}

function generateReportCacheFilePath(dateTimestamp: Date) {
  const date = `${dateTimestamp.getUTCFullYear()}.${dateTimestamp.getUTCMonth()}.${dateTimestamp.getUTCDate()}`;
  return `${Directories.getExpotoolsDir()}/cache/ios-pods-updateReport.${date}.cache.json`;
}

async function readCachedReports(reportFilename: string): Promise<IosProjectReport[] | null> {
  if (!(await pathExists(reportFilename))) {
    return null;
  }
  return readJSON(reportFilename);
}

async function cacheReports(reportFilename: string, reports: IosProjectReport[]) {
  await writeJSON(reportFilename, reports);
}

async function clearCachedReports(reportFilename: string) {
  if (await pathExists(reportFilename)) {
    await unlink(reportFilename);
  }
}

async function executePodCommand(args: string[], cwd: string): Promise<SpawnResult> {
  return await withSpinner(
    {
      command: `pod${args.length > 0 ? ` ${args.join(' ')}` : ''}`,
    },
    async () => {
      const result = await spawnAsync('pod', args, { cwd });
      if (result.status !== 0) {
        throw new Error(result.stderr);
      }
      return result;
    }
  )();
}

/**
 * Runs `pod repo update`
 */
async function updatePodRepo() {
  await executePodCommand(['repo', 'update'], Directories.getExpoRepositoryRootDir());
}

interface PodsReport {
  outdated: OutdatedPod[];
  deprecated: DeprecatedPod[];
}

interface DeprecatedPod {
  name: string;
  favoredPodName: string | null;
}

interface OutdatedPod {
  name: string;
  currentVersion: string;
  availableVersion: string | null;
  latestVersion: string;
}

async function executePodOutdated(projectPath: string): Promise<PodsReport> {
  const result = await executePodCommand(['outdated', '--no-ansi'], projectPath);

  const outdatedPodsSectionRegex = /(?<=The following pod updates are available:\n)[\s\S]*(?=The following pods are deprecated:)/gm;
  const deprecatedPodsSectionRegex = /(?<=The following pods are deprecated:\n)[\s\S]*/gm;
  const outdatedPodRegex = /^-\s(?<podName>[\w-]+)\s(?<currentVersion>[\w.-]+)\s->\s(?<availableVersion>[\w.-]+|\(unused\))\s\(latest\sversion\s(?<latestVersion>[\w.-]+)\)$/m;
  const deprecatedPodRegex = /^-\s(?<deprecatedPodName>[\w-]+)(\s\(in favor of (?<favoredPodName>[\w-]+)\))?/m;

  const outdatedPodsSection = result.stdout.match(outdatedPodsSectionRegex)?.[0];
  if (!outdatedPodsSection) {
    throw new Error(`Failed to read outdated pods in the project ${projectPath}`);
  }
  const deprecatedPodsSection = result.stdout.match(deprecatedPodsSectionRegex)?.[0] || '';

  const outdatedPods = (outdatedPodsSection.match(RegExp(outdatedPodRegex, 'gm')) ?? []).map(
    (hit) => hit.match(outdatedPodRegex)!
  );
  const deprecatedPods = (deprecatedPodsSection.match(RegExp(deprecatedPodRegex, 'gm')) ?? []).map(
    (hit) => hit.match(deprecatedPodRegex)!
  );

  const detectionFailureText = '<failed to detect>';

  return {
    outdated: outdatedPods.map(
      ({ groups: { podName, currentVersion, availableVersion, latestVersion } = {} }) => ({
        name: podName ?? detectionFailureText,
        currentVersion: currentVersion ?? detectionFailureText,
        availableVersion:
          availableVersion === '(unused)' ? null : availableVersion ?? detectionFailureText,
        latestVersion: latestVersion ?? detectionFailureText,
      })
    ),
    deprecated: deprecatedPods.map(({ groups: { deprecatedPodName, favoredPodName } = {} }) => ({
      name: deprecatedPodName ?? detectionFailureText,
      favoredPodName: favoredPodName ?? null,
    })),
  };
}

function mergePodsReports([firstPodsReport, ...restPodsReports]: PodsReport[]) {
  const result: PodsReport = {
    outdated: [...firstPodsReport.outdated],
    deprecated: [...firstPodsReport.deprecated],
  };

  const mergeUniquelyArrays = <T extends DeprecatedPod | OutdatedPod>(acc: T[], pods: T[]) => {
    for (const pod of pods) {
      if (!acc.find(({ name }) => name !== pod.name)) {
        acc.push(pod);
      }
    }
  };

  for (const podsReport of restPodsReports) {
    for (const key of ['deprecated', 'outdated'] as const) {
      // @ts-ignore
      mergeUniquelyArrays(result[key], podsReport[key]);
    }
  }

  return result;
}

/**
 * Performs `cocoapods command` that detects outdated dependencies.
 * This command is project-based, meaning: it provides accumulated report from the whole project.
 */
async function getPodsReport(iosProjectsPaths: string[]): Promise<PodsReport> {
  const podsReports = await Promise.all(iosProjectsPaths.map(executePodOutdated));
  const podsReport = mergePodsReports(podsReports);
  return podsReport;
}

interface PodDependency {
  name: string;
  version: string | null;
}

interface PodspecOrPodfile {
  projectName: string;
  filePath: string;
  dependencies: PodDependency[];
}

async function getPackagesPodspecs(): Promise<PodspecOrPodfile[]> {
  const packages = await getListOfPackagesAsync();

  const result: PodspecOrPodfile[] = await Promise.all(
    packages
      .filter((p) => Boolean(p.podspecName))
      .map(async (p) => {
        const filePath = (
          await glob('*.podspec', {
            cwd: path.resolve(p.path, p.iosSubdirectory),
          })
        )[0];
        const podspec = (await p.getPodspecAsync())!;
        return {
          projectName: p.podspecName!,
          filePath: path.resolve(p.path, p.iosSubdirectory, filePath),
          dependencies: Object.entries(podspec.dependencies ?? {}).map(([key, value]) => ({
            name: key,
            version: Array.isArray(value) ? (value?.[0] as string) ?? null : null,
          })),
        };
      })
  );
  return result;
}

async function getProjectsPodfiles(iosProjectsPaths: string[]): Promise<PodspecOrPodfile[]> {
  const parseDependencies = (podfileTargets: PodfileTargetDefinition[]): PodDependency[] => {
    const result: PodDependency[] = [];

    for (const { dependencies, children } of podfileTargets) {
      for (const dependency of dependencies ?? []) {
        if (typeof dependency === 'string') {
          result.push({ name: dependency, version: null });
        } else {
          result.push(
            ...Object.entries(dependency)
              .filter(
                ([_, attributes]) =>
                  Array.isArray(attributes) &&
                  attributes.length === 1 &&
                  typeof attributes[0] === 'string'
              )
              .map(([name, attributes]) => ({
                name,
                version: attributes[0] as string,
              }))
          );
        }
      }

      if (children) {
        result.push(...parseDependencies(children));
      }
    }
    return result;
  };

  const result: PodspecOrPodfile[] = (
    await Promise.all(
      iosProjectsPaths
        .map((iosProjectPath) => path.resolve(iosProjectPath, 'Podfile'))
        .map(async (filePath) => [filePath, await readPodfileAsync(filePath)] as const)
    )
  ).map(([filePath, podfile]) => {
    return {
      filePath,
      projectName: path.relative(Directories.getExpoRepositoryRootDir(), path.dirname(filePath)),
      dependencies: parseDependencies(podfile.target_definitions),
    };
  });

  return result;
}

/**
 * Reads Podfiles of the projects that paths are provided.
 * Reads podspecs of every iOS project from `packages/*` directory.
 */
const getPodfilesAndPodspecs = withSpinner(
  {
    text: 'Reading podfiles and podspecs',
  },
  async function getPodfilesAndPodspecs(iosProjectsPaths: string[]): Promise<PodspecOrPodfile[]> {
    const [podfiles, podspecs] = await Promise.all([
      getProjectsPodfiles(iosProjectsPaths),
      getPackagesPodspecs(),
    ]);
    return [...podspecs, ...podfiles];
  }
);

interface IosProjectReport {
  projectName: string;
  podsReport: PodsReport;
  changelogPath: string | null;
  podfileOrPodspecFilePath: string;
}

/**
 * Generates `per-Podfile` or `per-Podspec` report.
 * This function checks if any of reported pods from PodsReports argument
 * is a direct dependency of any iOS project.
 */
async function generateReports(
  podsReport: PodsReport,
  podspecsOrPodfiles: PodspecOrPodfile[]
): Promise<IosProjectReport[]> {
  const findChangelogFilePath = async (podfileOrPodspecPath: string): Promise<string | null> => {
    const changelogPath = path.resolve(podfileOrPodspecPath, '../../CHANGELOG.md');
    if (!podfileOrPodspecPath.includes('/packages/')) {
      return null;
    }
    if (!(await pathExists(changelogPath))) {
      return null;
    }
    return changelogPath;
  };

  const result: IosProjectReport[] = [];
  for (const project of podspecsOrPodfiles) {
    const projectReport: IosProjectReport = {
      projectName: project.projectName,
      podfileOrPodspecFilePath: project.filePath,
      changelogPath: await findChangelogFilePath(project.filePath),
      podsReport: {
        deprecated: [],
        outdated: [],
      },
    };

    for (const dependency of project.dependencies) {
      let outdated: OutdatedPod | null | undefined = null;
      let deprecated: DeprecatedPod | null | undefined = null;
      if ((outdated = podsReport.outdated.find(({ name }) => name === dependency.name))) {
        projectReport.podsReport.outdated.push({
          ...outdated,
          currentVersion: dependency.version ?? outdated.currentVersion,
        });
      } else if (
        (deprecated = podsReport.deprecated.find(({ name }) => name === dependency.name))
      ) {
        projectReport.podsReport.deprecated.push({
          ...deprecated,
        });
      }
    }
    if (
      projectReport.podsReport.deprecated.length > 0 ||
      projectReport.podsReport.outdated.length > 0
    ) {
      result.push(projectReport);
    }
  }
  return result;
}

export async function getIosProjectsReports(options: PodTaskOptions): Promise<IosProjectReport[]> {
  const timestamp = new Date();
  const reportCacheFilePath = generateReportCacheFilePath(timestamp);

  if (options.clearCache) {
    await clearCachedReports(reportCacheFilePath);
    logger.log('\n🗑 Cleared cached pod outdated reports.');
  }

  const cachedReports = await readCachedReports(reportCacheFilePath);
  if (cachedReports) {
    logger.info('📤 Using cached pod outdated reports.');
    return cachedReports;
  }

  await updatePodRepo();

  const iosProjectsPaths = [Directories.getIosDir(), `${Directories.getAppsDir()}/bare-expo/ios`];
  const podsReport = await getPodsReport(iosProjectsPaths);
  const podfilesAndPodspecs = await getPodfilesAndPodspecs(iosProjectsPaths);

  const reports = await generateReports(podsReport, podfilesAndPodspecs);
  await cacheReports(reportCacheFilePath, reports);
  return reports;
}
