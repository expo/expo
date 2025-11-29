import type { ExpoConfig } from '@expo/config';
import fs from 'fs';
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
    // In our monorepo, `expo/template.tgz` may not exist, or may be outdated, but we allow the template
    // to be resolved by manually installing `expo-template-bare-minimum`
    const templateRawPath = require(resolveFrom(projectRoot, 'expo/internal/unstable-template'));
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
