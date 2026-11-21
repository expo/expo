import { type ConfigPlugin, withXcodeProject } from '@expo/config-plugins';

const withProject: ConfigPlugin = (config) =>
  withXcodeProject(config, (config) => {
    config.modResults.hasFile('AppDelegate.mm');
    return config;
  });

export default withProject;
