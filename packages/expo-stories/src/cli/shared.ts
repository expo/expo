import path from 'path';

import { StoryOptions, StoryManifest } from '../types';

export const storiesDirName = '__generated__/stories';

export const defaultConfig: StoryOptions = {
  projectRoot: process.cwd(),
  watchRoot: process.cwd(),
};

export function getManifestFilePath(projectRoot: string) {
  const manifestFilePath = path.resolve(projectRoot, storiesDirName, 'storyManifest.json');
  return manifestFilePath;
}

export function getStoryManifest(projectRoot: string): StoryManifest {
  const manifestFilePath = getManifestFilePath(projectRoot);
  const storyManifest = require(manifestFilePath);
  return storyManifest;
}

export function getStories(config: StoryOptions) {
  const storyManifest = getStoryManifest(config.projectRoot);
  const stories = Object.keys(storyManifest.files).map((key) => {
    return storyManifest.files[key];
  });

  return stories;
}

export function getStoriesDir(config: StoryOptions) {
  const storiesDir = path.resolve(config.projectRoot, storiesDirName);
  return storiesDir;
}

export function getStoriesFile(config: StoryOptions) {
  const storiesDir = getStoriesDir(config);
  const storyFile = path.resolve(storiesDir, 'stories.js');
  return storyFile;
}

export function hashPath(filePath: string) {
  let id = filePath
    .split('/')
    .map((substr) => substr.replace(/[-.]/g, ''))
    .join('');

  // if it starts with a digit, replace that digit with its char equivalent
  if (id.match(/^\d/)) {
    const charForDigit = String.fromCharCode(97 + Number(id.charAt(0)));
    id = charForDigit + id.substring(1);
  }

  return id;
}
