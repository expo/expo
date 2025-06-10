import { ExpoConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { extractNpmTarballAsync } from '../utils/npm';

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
  const templatePath = resolveFrom(projectRoot, 'expo/template.tgz');
  debug('Using local template from Expo package:', templatePath);
  const stream = fs.createReadStream(templatePath);
  return await extractNpmTarballAsync(stream, {
    cwd: templateDirectory,
    name: exp.name,
  });
}
