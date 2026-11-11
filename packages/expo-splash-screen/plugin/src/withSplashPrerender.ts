import { ConfigPlugin, IOSConfig, withDangerousMod, withXcodeProject } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

export const PRERENDER_FILE_NAME = 'SplashScreenPrerender.json';

// A component (anything but `.json`) is rendered by `expo export:embed` at build time and written
// next to the JS bundle; only a prebuilt JSON template is copied into the native project here.
const isTemplateFile = (prerender?: string): prerender is string => !!prerender && prerender.endsWith('.json');

export const withIosSplashPrerender: ConfigPlugin<{ prerender?: string }> = (config, { prerender }) => {
  if (!isTemplateFile(prerender)) {
    return config;
  }
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const source = path.resolve(config.modRequest.projectRoot, prerender);
      const destination = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName!,
        PRERENDER_FILE_NAME
      );
      await fs.promises.copyFile(source, destination);
      return config;
    },
  ]);
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const filepath = path.join(config.modRequest.projectName!, PRERENDER_FILE_NAME);
    if (!project.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath,
        groupName: config.modRequest.projectName!,
        project,
        isBuildFile: true,
      });
    }
    return config;
  });
};

export const withAndroidSplashPrerender: ConfigPlugin<{ prerender?: string }> = (config, { prerender }) => {
  if (!isTemplateFile(prerender)) {
    return config;
  }
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const source = path.resolve(config.modRequest.projectRoot, prerender);
      const assetsDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets');
      await fs.promises.mkdir(assetsDir, { recursive: true });
      await fs.promises.copyFile(source, path.join(assetsDir, PRERENDER_FILE_NAME));
      return config;
    },
  ]);
};
