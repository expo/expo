import path from 'path';

import { ServerConfig } from '../types';

export const STORY_CACHE_DIR = '__generated__/stories';

export const defaultConfig: ServerConfig = {
  projectRoot: process.cwd(),
  watchRoot: process.cwd(),
  // eslint-disable-next-line
  port: parseInt(process.env.PORT ?? '7001'),
};

export function mergeConfigs(serverConfig: ServerConfig): ServerConfig {
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

export function getManifestFilePath(config: ServerConfig) {
  const manifestFilePath = path.resolve(config.projectRoot, STORY_CACHE_DIR, 'storyManifest.json');
  return manifestFilePath;
}

export function getStoryManifest(config: ServerConfig) {
  const manifestFilePath = getManifestFilePath(config);
  const storyManifest = require(manifestFilePath);
  return storyManifest;
}

export function getStories(config: ServerConfig) {
  const storyManifest = getStoryManifest(config);
  const stories = Object.keys(storyManifest.files).map(key => {
    return storyManifest.files[key];
  });

  return stories;
}

export function getStoriesCacheDir(config: ServerConfig) {
  const storiesDir = path.resolve(config.projectRoot, STORY_CACHE_DIR);
  return storiesDir;
}

export function getStoriesFile(config: ServerConfig) {
  const storiesDir = getStoriesCacheDir(config);
  const storyFile = path.resolve(storiesDir, 'stories.js');
  return storyFile;
}
