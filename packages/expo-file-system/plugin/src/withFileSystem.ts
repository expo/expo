import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-file-system/package.json');

type FileSystemProps = {
  supportsOpeningDocumentsInPlace?: boolean;
  enableFileSharing?: boolean;
};

const withFileSystem: ConfigPlugin<FileSystemProps> = (config, options = {}) => {
  // Apply Android permissions
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.INTERNET',
  ]);

  // Apply iOS modifications
  return withInfoPlist(config, (config) => {
    if ('supportsOpeningDocumentsInPlace' in options) {
      config.modResults.LSSupportsOpeningDocumentsInPlace = options.supportsOpeningDocumentsInPlace;
    }
    if ('enableFileSharing' in options) {
      config.modResults.UIFileSharingEnabled = options.enableFileSharing;
    }
    return config;
  });
};

export default createRunOncePlugin(withFileSystem, pkg.name, pkg.version);
