import chalk from 'chalk';
import { env } from 'process';

import { ALIASES } from './legacyTemplates';
import { resolveExpoVersions } from './resolveExpoVersions';
import { formatSelfCommand } from './resolvePackageManager';
import { splitNpmNameAndTag } from './utils/npm';

interface ExpoTemplateOptions {
  /** The template to create, formatted as npm version spec */
  template: string;
  /** The project name to create */
  projectName: string;
}

/**
 * Resolve the Expo Go compatible template and inform the user.
 * This only applies to first-party templates, listed in {@link ALIASES}.
 */
export async function resolveTemplate({
  template,
  projectName,
}: ExpoTemplateOptions): Promise<string> {
  const [name, version] = splitNpmNameAndTag(template);
  if (version || env.EXPO_BETA || !isExpoTemplate(name)) {
    console.log(chalk`Creating {cyan ${projectName}} using the {cyan ${template}} template.`);
    return template;
  }

  const versions = await resolveExpoVersions();
  if (!versions?.expoGoVersion) {
    console.log(chalk`Creating {cyan ${projectName}} using the {cyan ${template}} template.`);
    return template;
  }

  const expoGoTemplate = `${name}@sdk-${versions.expoGoVersion}`;
  const isLatestVersion = versions.expoGoVersion === versions.latestVersion;

  console.log(
    isLatestVersion
      ? chalk`Creating {cyan ${projectName}} using the {cyan ${expoGoTemplate}} template.`
      : chalk`Creating {cyan ${projectName}} using the Expo Go-compatible {cyan ${expoGoTemplate}} template.`
  );

  const cmd = formatSelfCommand();
  console.log(
    [
      '',
      chalk.dim('Tip:'),
      isLatestVersion
        ? null
        : chalk`  {dim $ ${cmd} {cyan --template ${name}@latest} to use the latest {bold Expo SDK ${versions.latestVersion}}}`,
      chalk`  {dim $ ${cmd} {cyan --template} to pick different templates}`,
      chalk`  {dim $ ${cmd} {cyan --example} to explore {underline https://github.com/expo/examples}}`,
      '',
    ]
      .filter((value) => value !== null)
      .join('\n')
  );

  return template;
}

function isExpoTemplate(name: string) {
  return ALIASES.includes(name.startsWith('expo-template-') ? name : `expo-template-${name}`);
}
