import fs from 'fs';
import path from 'path';
import semver from 'semver';

import type { IncorrectDependency } from './validateDependenciesVersions';
import { fetch } from '../../../utils/fetch';

const debug = require('debug')(
  'expo:doctor:dependencies:package-manager-age'
) as typeof console.log;

type PackageManagerAgeGate = {
  minimumAgeMs: number;
  excludedPackages: string[];
};

type NpmRegistryPackument = {
  time?: Record<string, string>;
};

/**
 * Package managers can intentionally avoid freshly published npm versions to
 * reduce supply-chain risk. If Expo's expected package version is still inside
 * that configured age window, the package manager will refuse to install the
 * version that expo-doctor recommends. In that case, suppress the warning and
 * let the user's package-manager policy catch up naturally.
 */
export async function filterDependenciesBlockedByPackageManagerAgeGateAsync(
  projectRoot: string,
  incorrectDeps: IncorrectDependency[],
  now: Date = new Date()
): Promise<IncorrectDependency[]> {
  if (!incorrectDeps.length) {
    return incorrectDeps;
  }

  const ageGate = await resolvePackageManagerAgeGateAsync(projectRoot);
  if (!ageGate) {
    return incorrectDeps;
  }

  const filtered = await Promise.all(
    incorrectDeps.map(async (dep) => {
      if (isPackageExcludedFromAgeGate(dep.packageName, ageGate.excludedPackages)) {
        return dep;
      }

      const expectedVersion = semver.minVersion(dep.expectedVersionOrRange)?.version;
      if (!expectedVersion) {
        return dep;
      }

      const publishedAt = await getPackageVersionPublishedAtAsync(dep.packageName, expectedVersion);
      if (!publishedAt) {
        return dep;
      }

      const ageMs = now.getTime() - publishedAt.getTime();
      if (ageMs >= 0 && ageMs < ageGate.minimumAgeMs) {
        debug(
          `Skipping ${dep.packageName}@${dep.expectedVersionOrRange}; package-manager release age gate still blocks ${expectedVersion}`
        );
        return null;
      }

      return dep;
    })
  );

  return filtered.filter(Boolean) as IncorrectDependency[];
}

async function resolvePackageManagerAgeGateAsync(
  projectRoot: string
): Promise<PackageManagerAgeGate | null> {
  const configs = await Promise.all([
    readYarnAgeGateAsync(projectRoot),
    readPnpmAgeGateAsync(projectRoot),
    readBunAgeGateAsync(projectRoot),
  ]);

  return configs.find(Boolean) ?? null;
}

async function readYarnAgeGateAsync(projectRoot: string): Promise<PackageManagerAgeGate | null> {
  const yarnrc = await readTextFileIfExistsAsync(path.join(projectRoot, '.yarnrc.yml'));
  if (!yarnrc) {
    return null;
  }

  const ageMinutes = readNumberProperty(yarnrc, 'npmMinimalAgeGate');
  if (!ageMinutes || ageMinutes <= 0) {
    return null;
  }

  return {
    minimumAgeMs: ageMinutes * 60 * 1000,
    excludedPackages: readYamlListProperty(yarnrc, 'npmPreapprovedPackages'),
  };
}

async function readPnpmAgeGateAsync(projectRoot: string): Promise<PackageManagerAgeGate | null> {
  const configText = (
    await Promise.all([
      readTextFileIfExistsAsync(path.join(projectRoot, '.npmrc')),
      readTextFileIfExistsAsync(path.join(projectRoot, '.pnpmrc')),
      readTextFileIfExistsAsync(path.join(projectRoot, 'pnpm-workspace.yaml')),
    ])
  )
    .filter(Boolean)
    .join('\n');

  if (!configText) {
    return null;
  }

  const ageMinutes = readNumberProperty(configText, 'minimumReleaseAge');
  if (!ageMinutes || ageMinutes <= 0) {
    return null;
  }

  return {
    minimumAgeMs: ageMinutes * 60 * 1000,
    excludedPackages: [
      ...readIniListProperty(configText, 'minimumReleaseAgeExclude'),
      ...readYamlListProperty(configText, 'minimumReleaseAgeExclude'),
    ],
  };
}

async function readBunAgeGateAsync(projectRoot: string): Promise<PackageManagerAgeGate | null> {
  const bunfig = await readTextFileIfExistsAsync(path.join(projectRoot, 'bunfig.toml'));
  if (!bunfig) {
    return null;
  }

  const ageSeconds = readNumberProperty(bunfig, 'minimumReleaseAge');
  if (!ageSeconds || ageSeconds <= 0) {
    return null;
  }

  return {
    minimumAgeMs: ageSeconds * 1000,
    excludedPackages: readTomlArrayProperty(bunfig, 'minimumReleaseAgeExcludes'),
  };
}

async function readTextFileIfExistsAsync(filePath: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

function readNumberProperty(text: string, propertyName: string): number | null {
  const match = text.match(new RegExp(`^\\s*${propertyName}\\s*[:=]\\s*(\\d+)\\s*$`, 'm'));
  return match ? Number(match[1]!) : null;
}

function readIniListProperty(text: string, propertyName: string): string[] {
  const match = text.match(new RegExp(`^\\s*${propertyName}\\s*=\\s*(.+?)\\s*$`, 'm'));
  if (!match) {
    return [];
  }
  return splitPackageList(match[1]!);
}

function readYamlListProperty(text: string, propertyName: string): string[] {
  const inline = text.match(new RegExp(`^\\s*${propertyName}\\s*:\\s*\\[(.*?)\\]\\s*$`, 'm'));
  if (inline) {
    return splitPackageList(inline[1]!);
  }

  const block = text.match(
    new RegExp(`^\\s*${propertyName}\\s*:\\s*\\n((?:\\s+-\\s+.+\\n?)+)`, 'm')
  );
  if (!block) {
    return [];
  }

  return block[1]!
    .split('\n')
    .map((line) => line.match(/^\s+-\s+(.+?)\s*$/)?.[1])
    .filter((value): value is string => !!value)
    .map((value) => stripQuotes(value));
}

function readTomlArrayProperty(text: string, propertyName: string): string[] {
  const match = text.match(new RegExp(`^\\s*${propertyName}\\s*=\\s*\\[(.*?)\\]\\s*$`, 'm'));
  return match ? splitPackageList(match[1]!) : [];
}

function splitPackageList(value: string): string[] {
  return value
    .split(',')
    .map((item) => stripQuotes(item.trim()))
    .filter(Boolean);
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '');
}

function isPackageExcludedFromAgeGate(packageName: string, excludedPackages: string[]): boolean {
  return excludedPackages.some((pattern) => {
    if (pattern === packageName) {
      return true;
    }

    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.split('*').map(escapeRegExp).join('.*')}$`);
      return regex.test(packageName);
    }

    return false;
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

async function getPackageVersionPublishedAtAsync(
  packageName: string,
  version: string
): Promise<Date | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
    if (!response.ok) {
      return null;
    }

    const packument = (await response.json()) as NpmRegistryPackument;
    const publishedAt = packument.time?.[version];
    return publishedAt ? new Date(publishedAt) : null;
  } catch {
    return null;
  }
}
