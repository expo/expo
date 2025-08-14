import { ExpoConfig } from '@expo/config-types';
import fs from 'fs';
import path from 'path';
import { XcodeProject } from 'xcode';

import { ConfigPlugin } from '../Plugin.types';
import { addResourceFileToGroup, ensureGroupRecursively, getProjectName } from './utils/Xcodeproj';
import { withXcodeProject } from '../plugins/ios-plugins';
import { getResolvedLocalesAsync, LocaleJson } from '../utils/locales';

export const withLocales: ConfigPlugin = (config) => {
  return withXcodeProject(config, async (config) => {
    config.modResults = await setLocalesAsync(config, {
      projectRoot: config.modRequest.projectRoot,
      project: config.modResults,
    });
    return config;
  });
};

export async function writeStringsFile({
  localesMap,
  supportingDirectory,
  fileName,
  projectName,
  project,
}: {
  localesMap: LocaleJson | Record<string, LocaleJson>;
  supportingDirectory: string;
  fileName: string;
  projectName: string;
  project: XcodeProject;
}) {
  for (const [lang, localizationObj] of Object.entries(localesMap)) {
    if (Object.entries(localizationObj).length === 0) return project;
    const dir = path.join(supportingDirectory, `${lang}.lproj`);
    // await fs.ensureDir(dir);
    await fs.promises.mkdir(dir, { recursive: true });

    const strings = path.join(dir, fileName);
    const buffer = [];
    for (const [plistKey, localVersion] of Object.entries(localizationObj)) {
      buffer.push(`${plistKey} = "${localVersion}";`);
    }
    // Write the file to the file system.
    await fs.promises.writeFile(strings, buffer.join('\n'));

    const groupName = `${projectName}/Supporting/${lang}.lproj`;
    // deep find the correct folder
    const group = ensureGroupRecursively(project, groupName);

    // Ensure the file doesn't already exist
    if (!group?.children.some(({ comment }) => comment === fileName)) {
      // Only write the file if it doesn't already exist.
      project = addResourceFileToGroup({
        filepath: path.relative(supportingDirectory, strings),
        groupName,
        project,
        isBuildFile: true,
        verbose: true,
      });
    }
  }
  return project;
}

export function getLocales(
  config: Pick<ExpoConfig, 'locales'>
): Record<string, string | LocaleJson> | null {
  return config.locales ?? null;
}

export async function setLocalesAsync(
  config: Pick<ExpoConfig, 'locales'>,
  { projectRoot, project }: { projectRoot: string; project: XcodeProject }
): Promise<XcodeProject> {
  const locales = getLocales(config);
  if (!locales) {
    return project;
  }
  // possibly validate CFBundleAllowMixedLocalizations is enabled
  const { locales: localesMap, localizableStrings } = await getResolvedLocalesAsync(
    projectRoot,
    locales,
    'ios'
  );

  const projectName = getProjectName(projectRoot);
  const supportingDirectory = path.join(projectRoot, 'ios', projectName, 'Supporting');

  // TODO: Should we delete all before running? Revisit after we land on a lock file.
  project = await writeStringsFile({
    localesMap,
    supportingDirectory,
    fileName: 'InfoPlist.strings',
    projectName,
    project,
  });
  if (localizableStrings) {
    project = await writeStringsFile({
      localesMap: localizableStrings,
      supportingDirectory,
      fileName: 'Localizable.strings',
      projectName,
      project,
    });
  }
  return project;
}
