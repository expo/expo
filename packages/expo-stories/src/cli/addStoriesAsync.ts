import fse from 'fs-extra';
import path from 'path';

import { StoryOptions, StoryFile, StoryManifest } from '../types';
import { saveManifestAsync } from './saveManifestAsync';
import { getStoryManifest, hashPath } from './shared';
import { writeStoriesAsync } from './writeStoriesAsync';

export async function addStoriesAsync(relPaths: string[], config: StoryOptions) {
  const { watchRoot, projectRoot } = config;

  // 1. read story manifest
  const storyManifest: StoryManifest = getStoryManifest(projectRoot);

  // 2. update story manifest with new files
  await Promise.all(
    relPaths.map(async (relativePath) => {
      const fullPath = path.resolve(watchRoot, relativePath);
      const id = hashPath(fullPath);

      const defaultTitle = relativePath.split('/').pop()?.replace('.stories.tsx', '');

      const story = await parseStoryConfigAsync({
        id,
        fullPath,
        relativePath,
        title: defaultTitle || '',
        stories: [],
      });

      storyManifest.files[story.id] = story;
    })
  );

  // 3. save updated manifest to disk
  await saveManifestAsync(storyManifest, config);

  // 4. write js file based on updated manifest
  await writeStoriesAsync(config);
}

async function parseStoryConfigAsync(storyFile: StoryFile) {
  const { fullPath, id } = storyFile;
  const file = await fse.readFile(fullPath, { encoding: 'utf-8' });

  const acorn = require('acorn-loose');

  const parsed = acorn.parse(file, {
    ecmaVersion: 2020,
    sourceType: 'module',
  });

  const storyData = {
    ...storyFile,
  };

  parsed.body.forEach((node) => {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration !== null) {
        const { type } = node.declaration;
        if (type === 'VariableDeclaration') {
          node.declaration.declarations.forEach((d) => {
            const name = d.id.name;
            storyData.stories.push({
              name,
              id: `${id}_${name}`,
            });
          });
        }

        if (type === 'FunctionDeclaration') {
          const name = node.declaration.id.name;
          console.log({ node });

          storyData.stories.push({
            name,
            id: `${id}_${name}`,
          });
        }
      }

      if (node.specifiers.length > 0) {
        node.specifiers.forEach((specifier) => {
          const name = specifier.exported.name;
          if (!storyData.stories.includes(name)) {
            storyData.stories.push({
              name,
              id: `${id}_${name}`,
            });
          }
        });
      }
    }
  });

  const defaultExport = parsed.body.find((node) => node.type === 'ExportDefaultDeclaration');

  if (defaultExport) {
    defaultExport.declaration.properties.forEach((property) => {
      const key = property.key.name;
      const value = property.value.value;

      storyData[key] = value;
    });
  }

  return storyData;
}
