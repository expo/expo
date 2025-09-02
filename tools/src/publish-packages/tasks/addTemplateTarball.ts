import fs from 'fs';
import path from 'path';

import { TEMPLATES_DIR } from '../../Constants';
import { packToTarballAsync } from '../../Npm';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { Parcel, TaskArgs } from '../types';
import { selectPackagesToPublish } from './selectPackagesToPublish';

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

    return await runWithSpinner(
      'Copying template tarball to Expo package',
      async () => {
        const templatePath = path.join(TEMPLATES_DIR, 'expo-template-bare-minimum');
        const templateTarball = await packToTarballAsync(templatePath);

        const tarballDestinationPath = path.join(expoPackage.pkg.path, 'template.tgz');
        await fs.promises.rm(tarballDestinationPath, { force: true });
        await fs.promises.copyFile(
          path.join(templatePath, templateTarball.filename),
          tarballDestinationPath
        );
      },
      'Copied template tarball to Expo package'
    );
  }
);
