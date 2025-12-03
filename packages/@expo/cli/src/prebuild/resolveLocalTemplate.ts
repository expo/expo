import type { ExpoConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { copyNodeModuleAsync, extractNpmTarballAsync } from '../utils/npm';

const debug = require('debug')('expo:prebuild:resolveLocalTemplate') as typeof console.log;

export async function resolveLocalTemplateAsync({
  templateDirectory,
  projectRoot,
  exp,
}: {
  templateDirectory: string;
  projectRoot: string;
  exp: Pick<ExpoConfig, 'name'>;
}): Promise<string> {
  try {
    // In our monorepo, `expo/template.tgz` may not exist, or may be outdated, so we first check
    // `expo-template-bare-minimum`, which is a dev-dependency in `@expo/cli` that's only fulfilled
    // in our monorepo
    const templateRawPath = path.dirname(require.resolve('expo-template-bare-minimum'));
    debug('Using local template from expo-template-bare-minimum path:', templateRawPath);
    return await copyNodeModuleAsync(templateRawPath, {
      cwd: templateDirectory,
      name: exp.name,
    });
  } catch (error) {
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
