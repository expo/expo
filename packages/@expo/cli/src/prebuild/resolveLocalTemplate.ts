import type { ExpoConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { packNpmTarballAsync, extractNpmTarballAsync } from '../utils/npm';

const debug = require('debug')('expo:prebuild:resolveLocalTemplate') as typeof console.log;

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
    debug('Packing local template from expo-template-bare-minimum path:', monorepoTemplatePath);
    try {
      templatePath = await packNpmTarballAsync(monorepoTemplatePath);
      debug('Using packed local template at:', templatePath);
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
    debug('Using local template from Expo package:', templatePath);
  }

  const stream = fs.createReadStream(templatePath);
  return await extractNpmTarballAsync(stream, templateDirectory, {
    expName: exp.name,
  });
}
