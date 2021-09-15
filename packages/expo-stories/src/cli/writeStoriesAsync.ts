import fse from 'fs-extra';
import path from 'path';

import { StoryOptions, StoryFile } from '../types';
import { getStoriesDir, getStoryManifest } from './shared';

export async function writeStoriesAsync(config: StoryOptions) {
  const storyManifest = getStoryManifest(config.projectRoot);
  const stories = Object.keys(storyManifest.files).map((id) => storyManifest.files[id]);

  let template = `
      const storiesToExport = {}
      ${stories.map((story) => generateTemplateForStory(story)).join('')}
      module.exports = storiesToExport
    `;

  if (!process.env.EXPO_DEBUG) {
    template = require('esbuild').transformSync(template, {
      minify: true,
    }).code;
  }

  const storiesDir = getStoriesDir(config);
  const writeRequiresPath = path.resolve(storiesDir, 'stories.js');
  await fse.writeFile(writeRequiresPath, template, { encoding: 'utf-8' });
}

// the formatting of this template is important because it preserves fast refresh w/ metro
function generateTemplateForStory(story: StoryFile) {
  const defaultTitle = story.relativePath.replace('.stories.tsx', '').split('/').pop();

  return `
    function ${story.id}Setup() {
      const stories = require("${story.fullPath}")
      const file = stories.default || {}
      file.id = "${story.id}"
      file.title = file.title || '${defaultTitle}'

      Object.keys(stories).forEach((key) => {
        const Component = stories[key]
        
        if (typeof Component === "function") {
          const storyId = "${story.id}" + "_" + key
          
          Component.storyConfig = {
            id: storyId,
            name: key,
            ...Component.storyConfig,
          }

          Component.file = file

          storiesToExport[storyId] = Component 
        }
      })
    }

    ${story.id}Setup()
  `;
}
