import fs from 'fs-extra';
import path from 'path';

import { EXPOTOOLS_DIR } from '../../Constants';
import logger from '../../Logger';
import { applyPatchAsync } from '../../Utils';
import { VendoringTargetConfig } from '../types';

const config: VendoringTargetConfig = {
  name: 'Expo Go',
  modules: {
    'amazon-cognito-identity-js': {
      source: 'https://github.com/aws-amplify/amplify-js.git',
    },
    'react-native-view-shot': {
      source: 'https://github.com/gre/react-native-view-shot.git',
    },
    'react-native-webview': {
      source: 'react-native-webview',
      sourceType: 'npm',
      excludeFiles: ['src/__tests__/**/*'],
      async postCopyFilesHookAsync(sourceDirectory, targetDirectory) {
        // patch for scoped webview
        const patchFile = path.join(
          EXPOTOOLS_DIR,
          'src/vendoring/config/react-native-webview-scoping.patch'
        );
        const patchContent = await fs.readFile(patchFile, 'utf8');
        try {
          await applyPatchAsync({
            patchContent,
            cwd: targetDirectory,
            stripPrefixNum: 0,
          });
        } catch (e) {
          logger.error(
            `Failed to apply patch: \`patch -p0 -d '${targetDirectory}' < ${patchFile}\``
          );
          throw e;
        }
      },
    },
    '@react-native-async-storage/async-storage': {
      source: '@react-native-async-storage/async-storage',
      sourceType: 'npm',
      async postCopyFilesHookAsync(sourceDirectory, targetDirectory) {
        // patch for scoped async storage
        const patchFile = path.join(
          EXPOTOOLS_DIR,
          'src/vendoring/config/react-native-async-storage-scoped-storage.patch'
        );
        const patchContent = await fs.readFile(patchFile, 'utf8');
        try {
          await applyPatchAsync({
            patchContent,
            cwd: targetDirectory,
            stripPrefixNum: 0,
          });
        } catch (e) {
          logger.error(
            `Failed to apply patch: \`patch -p0 -d '${targetDirectory}' < ${patchFile}\``
          );
          throw e;
        }
      },
    },
  },
};

export default config;
