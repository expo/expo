import type { ExpoConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { copyNodeModuleAsync, extractNpmTarballAsync } from '../utils/npm';

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
  const monorepoTemplatePath = await getMonorepoTemplatePath();
  if (monorepoTemplatePath) {
    // NOTE: In the expo/expo monorepo only, we use `templates/expo-template-bare-minimum` directly
    debug('Using local template from expo-template-bare-minimum path:', monorepoTemplatePath);
    return await copyNodeModuleAsync(monorepoTemplatePath, {
      cwd: templateDirectory,
      name: exp.name,
    });
  } else {
    // The default is to use `expo/template.tgz` which exists in all published versions of it
    const templatePath = resolveFrom(projectRoot, 'expo/template.tgz');
    debug('Using local template from Expo package:', templatePath);
    const stream = fs.createReadStream(templatePath);
    return await extractNpmTarballAsync(stream, {
      cwd: templateDirectory,
      name: exp.name,
    });
  }
}
