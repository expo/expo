import { Command } from '@expo/commander';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR, TEMPLATES_DIR } from '../Constants';
import logger from '../Logger';
import { packToTarballAsync } from '../Npm';

const EXPO_PACKAGE_PATH = path.join(EXPO_DIR, 'packages/expo');
const TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'expo-template-bare-minimum');
const TEMPLATE_TARBALL_PATH = path.join(EXPO_PACKAGE_PATH, 'template.tgz');

async function createExpoTemplateTarballAsync(): Promise<void> {
  // Never allow a failed template pack to leave an older artifact available to the outer pack.
  await fs.remove(TEMPLATE_TARBALL_PATH);

  const templateTarball = await packToTarballAsync(TEMPLATE_PATH);

  try {
    await fs.copyFile(templateTarball.filePath, TEMPLATE_TARBALL_PATH);
  } finally {
    await fs.remove(path.dirname(templateTarball.filePath));
  }

  logger.success('Created packages/expo/template.tgz from expo-template-bare-minimum.');
}

export default (program: Command) => {
  program
    .command('create-expo-template-tarball')
    .description('Creates the bare-minimum template tarball embedded in the expo package.')
    .asyncAction(createExpoTemplateTarballAsync);
};
