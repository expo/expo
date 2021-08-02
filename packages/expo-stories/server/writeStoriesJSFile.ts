import fs from 'fs';
import path from 'path';

import { ServerConfig, StoryManifestItem } from '../types';
import { getStories, getStoriesCacheDir } from './shared';

function writeStoriesJSFile(serverConfig: ServerConfig) {
  const stories = getStories(serverConfig);

  let template = `
      const storiesToExport = {}
      ${writeStoryRequires(stories)}
      module.exports = storiesToExport
    `;

  if (!process.env.EXPO_DEBUG) {
    template = require('esbuild').transformSync(template, {
      minify: true,
    }).code;
  }

  const storiesDir = getStoriesCacheDir(serverConfig);
  const writeRequiresPath = path.resolve(storiesDir, 'stories.js');
  fs.writeFileSync(writeRequiresPath, template, { encoding: 'utf-8' });
}

function writeStoryRequires(stories: StoryManifestItem[]) {
  return stories
    .map(story => {
      const defaultTitle = story.relativePath
        .replace('.stories.tsx', '')
        .split('/')
        .pop();

      return `
          function ${story.id}Setup() {
            const stories = require("${story.fullPath}")
            const parentConfig = stories.default || {}
            parentConfig.id = "${story.id}"
            parentConfig.title = parentConfig.title || '${defaultTitle}'

            Object.keys(stories).forEach((key) => {
              const Component = stories[key]
              
              if (typeof Component === "function") {
                const storyId = "${story.id}" + "_" + key
                
                Component.storyConfig = {
                  id: storyId,
                  name: key,
                  ...Component.storyConfig,
                }

                Component.parentConfig = parentConfig

                storiesToExport[storyId] = Component 
              }
            })
          }

          ${story.id}Setup()
        `;
    })
    .join('\n');
}

export { writeStoriesJSFile };
