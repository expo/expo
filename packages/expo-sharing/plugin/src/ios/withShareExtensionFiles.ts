import { ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import path from 'path';

import { ActivationRule } from '../sharingPlugin.types';
import { setupShareExtensionFiles, ShareExtensionFiles } from './setupShareExtensionFiles';

type WithShareExtensionSourceFilesProps = {
  targetName: string;
  appGroupId: string;
  urlScheme: string;
  activationRule: ActivationRule;
  onFilesWritten: (files: ShareExtensionFiles) => void;
};
export const withShareExtensionFiles: ConfigPlugin<WithShareExtensionSourceFilesProps> = (
  config,
  { targetName, appGroupId, urlScheme, activationRule, onFilesWritten }
) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const { platformProjectRoot } = config.modRequest;
      const targetPath = path.join(platformProjectRoot, targetName);

      const files = setupShareExtensionFiles(
        targetPath,
        targetName,
        appGroupId,
        urlScheme,
        activationRule
      );

      onFilesWritten(files);

      return config;
    },
  ]);
