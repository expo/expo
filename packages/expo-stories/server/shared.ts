import path from 'path';

import { IServerConfig } from '../types';

export const STORY_CACHE_DIR = '__generated__/stories';

export const defaultConfig: IServerConfig = {
  projectRoot: process.cwd(),
  watchRoot: process.cwd(),
  // eslint-disable-next-line
  port: parseInt(process.env.PORT ?? '7001'),
};

export function mergeConfigs(serverConfig: IServerConfig): IServerConfig {
  let config = {
    ...defaultConfig,
    ...serverConfig,
  };

  const pathToPackageJson = path.resolve(config.projectRoot, 'package.json');
  const packageJson = require(pathToPackageJson);
  const packageJsonConfig = packageJson.expoStories ?? {};

  config = {
    ...config,
    ...packageJsonConfig,
  };

  return config;
}

export function getManifestFilePath(config: IServerConfig) {
  const manifestFilePath = path.resolve(config.projectRoot, STORY_CACHE_DIR, 'storyManifest.json');
  return manifestFilePath;
}

export function getStoryManifest(config: IServerConfig) {
  const manifestFilePath = getManifestFilePath(config);
  const storyManifest = require(manifestFilePath);
  return storyManifest;
}

export function getStories(config: IServerConfig) {
  const storyManifest = getStoryManifest(config);
  const stories = Object.keys(storyManifest.files).map(key => {
    return storyManifest.files[key];
  });

  return stories;
}

export function getStoriesCacheDir(config: IServerConfig) {
  const storiesDir = path.resolve(config.projectRoot, STORY_CACHE_DIR);
  return storiesDir;
}

export function getStoriesFile(config: IServerConfig) {
  const storiesDir = getStoriesCacheDir(config);
  const storyFile = path.resolve(storiesDir, 'stories.js');
  return storyFile;
}
