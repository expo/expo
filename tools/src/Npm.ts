import fetch from 'node-fetch';
import { spawnAsync, spawnJSONCommandAsync } from './Utils';
import { cacheData, readCache } from './utils/fileCache';
import { JSDOM } from 'jsdom';

export const EXPO_DEVELOPERS_TEAM_NAME = 'expo:developers';

export type PackageViewType = null | {
  name: string;
  version: string;
  'dist-tags': {
    latest: string;
    [tag: string]: string;
  };
  versions: string[];
  time: {
    created: string;
    modified: string;
    [time: string]: string;
  };
  maintainers: string[];
  description: string;
  author: string;
  gitHead: string;
  // and more but these are the basic ones, we shouldn't need more.
  [key: string]: unknown;
};

/**
 * Runs `npm view` for package with given name. Returns null if package is not published yet.
 */
export async function getPackageViewAsync(
  packageName: string,
  version?: string
): Promise<PackageViewType> {
  try {
    return await spawnJSONCommandAsync('npm', [
      'view',
      version ? `${packageName}@${version}` : packageName,
      '--json',
    ]);
  } catch (error) {
    return null;
  }
}

/**
 * Publishes a package at given directory to the global npm registry.
 */
export async function publishPackageAsync(
  packageDir: string,
  tagName: string = 'latest',
  dryRun: boolean = false
): Promise<void> {
  const args = ['publish', '--tag', tagName, '--access', 'public'];

  if (dryRun) {
    args.push('--dry-run');
  }
  await spawnAsync('npm', args, {
    cwd: packageDir,
  });
}

/**
 * Adds dist-tag to a specific version of the package.
 */
export async function addTagAsync(
  packageName: string,
  version: string,
  tagName: string
): Promise<void> {
  await spawnAsync('npm', ['dist-tag', 'add', `${packageName}@${version}`, tagName]);
}

/**
 * Removes package's tag with given name.
 */
export async function removeTagAsync(packageName: string, tagName: string): Promise<void> {
  await spawnAsync('npm', ['dist-tag', 'rm', packageName, tagName]);
}

/**
 * Gets a list of user names in the team with given team name.
 */
export async function getTeamMembersAsync(teamName: string): Promise<string[]> {
  return await spawnJSONCommandAsync('npm', ['team', 'ls', teamName, '--json']);
}

/**
 * Adds a package to organization team granting access to everyone in the team.
 */
export async function grantReadWriteAccessAsync(
  packageName: string,
  teamName: string
): Promise<void> {
  await spawnAsync('npm', ['access', 'grant', 'read-write', teamName, packageName]);
}

/**
 * Returns a name of the currently logged in user or `null` if logged out.
 */
export async function whoamiAsync(): Promise<string | null> {
  try {
    const { stdout } = await spawnAsync('npm', ['whoami']);
    return stdout.trim();
  } catch (e) {
    return null;
  }
}

async function fetchDownloadStatsAsync(packageName: string) {
  const cacheKey = `npm.download_stats.${packageName}`;
  const cachedData = await readCache<typeof result>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const result = {
    byVersions: await scrapNpmDownloadsByVersion(packageName),
    byTimePeriods: await downloadNpmDownloadsByTimePeriod(packageName),
  };

  await cacheData(cacheKey, result);
  return result;
}

/**
 * Adapted from https://gist.github.com/DavidWells/5c99bf9cd3277700cb40114b72b8a113
 */
async function downloadNpmDownloadsByTimePeriod(packageName: string) {
  const getDateRange = (daysOffset?: number) => {
    const pad = (n: number) => `${n < 10 ? '0' : ''}${n}`;
    let date = new Date();
    if (daysOffset) {
      date.setTime(date.getTime() + daysOffset * 1000 * 60 * 60 * 24);
    }
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  };

  const periods = {
    'last-day': 'last-day',
    'last-week': 'last-week',
    'last-month': 'last-month',
    'last-year': `${getDateRange(-365)}:${getDateRange()}`,
  } as const;

  const stats = await Promise.all(
    Object.entries(periods).map(([k, v]) =>
      fetch(`https://api.npmjs.org/downloads/point/${v}/${packageName}`)
        .then((res) => res.json())
        .then((json) => [k, json.downloads as number] as const)
    )
  );
  return Object.fromEntries(stats) as { [k in keyof typeof periods]: number };
}

async function scrapNpmDownloadsByVersion(packageName: string) {
  const scrapedPage = await fetch(
    `https://www.npmjs.com/package/${packageName}?activeTab=versions`
  ).then((res) => res.text());

  const dom = new JSDOM(scrapedPage);
  const versionsContainer = dom.window.document.querySelector(
    '#tabpanel-versions > div > :last-child'
  );
  if (!versionsContainer) {
    throw new Error(`Failed to locate versions ul element for ${packageName}`);
  }
  const [_, ...versions] = Array.from(versionsContainer.children);
  const perVersionEntires = versions.map((el) => {
    const version = el.querySelector('a')?.textContent;
    const downloads = Number(el.querySelector('code')?.textContent?.replaceAll(',', ''));
    const releaseDate = el.querySelector('time')?.dateTime;
    return [version, { downloads, releaseDate } as const];
  });
  return Object.fromEntries(perVersionEntires) as {
    [key: string]: { downloads: number; releaseDate: string };
  };
}

export type NpmDownloadStats = Awaited<ReturnType<typeof getDownloadStatsAsync>>;

/**
 * Returns the download stats both version-based and time period-based.
 */
export async function getDownloadStatsAsync(packageName: string) {
  const stats = await fetchDownloadStatsAsync(packageName);
  return stats;
}
