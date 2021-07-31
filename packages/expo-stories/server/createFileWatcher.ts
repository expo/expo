import fs from 'fs';
import glob from 'glob';
import path from 'path';
import sane from 'sane';

import { IServerConfig, IStoryHttpServer } from '../types';
import { generateId } from './generateId';
import { saveStoryDataAtPath } from './saveStoryDataAtPath';
import { getManifestFilePath, getStories, getStoryManifest } from './shared';
import { writeStoriesJSFile } from './writeStoriesJSFile';

function createFileWatcher(config: IServerConfig, server: IStoryHttpServer) {
  const { watchRoot } = config;

  const results = glob.sync('**/*.stories.{tsx,ts,js,jsx}', {
    cwd: watchRoot,
    ignore: ['**/node_modules/**', '**/ios/**', '**/android/**'],
  });

  results.forEach(relPath => {
    saveStoryDataAtPath(config, relPath);
  });

  const manifestFilePath = getManifestFilePath(config);
  const storyManifest = getStoryManifest(config);

  const watcher = sane(watchRoot, {
    glob: ['**/*.stories.tsx', '**/*.stories.js', '**/*.stories.ts', '**/*.stories.jsx'],
    ignored: ['node_modules'],
    watchman: true,
  });

  // require filepath shoul pick up on fast refresh changes
  // any other changes would need to go through websockets
  // watcher.on('change', relPath => {
  //   saveStoryDataAtPath(config, relPath);
  //   server.refreshClients();
  // });

  watcher.on('add', relPath => {
    saveStoryDataAtPath(config, relPath);
    server.refreshClients();
  });

  watcher.on('delete', function(relPath) {
    const fullPath = path.resolve(watchRoot, relPath);
    const id = generateId(fullPath);

    delete storyManifest.files[id];
    const storyManifestAsString = JSON.stringify(storyManifest, null, '\t');

    fs.writeFileSync(manifestFilePath, storyManifestAsString, {
      encoding: 'utf-8',
    });

    writeStoriesJSFile(config);
    server.refreshClients();
  });

  watcher.on('ready', () => {
    server.start();
    server.refreshClients();
    logStories();
  });

  function logStories() {
    const stories = getStories(config);
    console.log('Stories found: \n');
    console.log({ stories });
  }

  function cleanup() {
    watcher.close();
  }

  return {
    cleanup,
  };
}

export { createFileWatcher };
