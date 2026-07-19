import type { ExpoConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { packNpmTarballAsync, extractLocalNpmTarballAsync } from '../utils/npm';
import { debugEvent } from './events';

/** Returns the `local-template` target path, only for the `expo/expo` monorepo */
const getMonorepoTemplatePath = async () => {
  const cliPath = path.dirname(require.resolve('@expo/cli/package.json'));
  const localTemplateOriginPath = path.join(cliPath, 'local-template');
  try {
    return await fs.promises.realpath(localTemplateOriginPath);
  } catch {
    return null;
  }
};

export async function resolveLocalTemplateAsync({
  templateDirectory,
  projectRoot,
  exp,
}: {
  templateDirectory: string;
  projectRoot: string;
  exp: Pick<ExpoConfig, 'name'>;
}): Promise<string> {
  let templatePath: string;

  // In the expo/expo monorepo only, we use `templates/expo-template-bare-minimum` directly
  const monorepoTemplatePath = await getMonorepoTemplatePath();
  if (monorepoTemplatePath) {
    debugEvent('local_template_packing', { path: debugEvent.path(monorepoTemplatePath) });
    try {
      templatePath = await packNpmTarballAsync(monorepoTemplatePath);
      debugEvent('local_template_packed', { path: debugEvent.path(templatePath) });
    } catch (error) {
      // We're vocal here about an error, since we don't expect this to fail, and it's only for our monorepo
      console.error(
        `Failed to pack local expo-template-bare-minimum to be used as a prebuild template:\n`,
        error
      );
      throw error;
    }
  } else {
    // The default is to use `expo/template.tgz` which exists in all published versions of it
    templatePath = resolveFrom(projectRoot, 'expo/template.tgz');
    debugEvent('local_template_fallback', { path: debugEvent.path(templatePath) });
  }

  return await extractLocalNpmTarballAsync(templatePath, templateDirectory, {
    expName: exp.name,
  });
}
