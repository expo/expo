import { promises } from 'fs';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import { TEMPLATES_DIR } from '../../Constants';
import logger from '../../Logger';
import { packToTarballAsync } from '../../Npm';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';

/**
 * Add template tarball to Expo package.
 */
export const addTemplateTarball = new Task<TaskArgs>(
  {
    name: 'addTemplateTarball',
    dependsOn: [selectPackagesToPublish],
  },
  async (parcels: Parcel[]) => {
    const expoPackage = parcels.find((parcel) => parcel.pkg.packageName === 'expo');

    if (!expoPackage) {
      return;
    }

    logger.info('\nCopying template tarball to Expo package...');

    const templatePath = path.join(TEMPLATES_DIR, 'expo-template-bare-minimum');
    const templateTarball = await packToTarballAsync(templatePath);

    await promises.copyFile(
      path.join(templatePath, templateTarball.filename),
      path.join(expoPackage.pkg.path, 'template.tgz')
    );
  }
);
