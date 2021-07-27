import fs from 'fs';
import path from 'path';

import { IServerConfig, IStoryManifestItem } from '../types';
import { generateId } from './generateId';
import { getManifestFilePath, getStoryManifest } from './shared';
import { writeStoriesJSFile } from './writeStoriesJSFile';

function saveStoryDataAtPath(config: IServerConfig, relPath: string) {
  const { watchRoot } = config;
  const fullPath = path.resolve(watchRoot, relPath);
  const fileAsString = fs.readFileSync(fullPath, { encoding: 'utf-8' });

  const manifestFilePath = getManifestFilePath(config);
  const storyManifest = getStoryManifest(config);

  const id = generateId(fullPath);
  const acorn = require('acorn-loose');

  const parsed = acorn.parse(fileAsString, {
    ecmaVersion: 2020,
    sourceType: 'module',
  });

  const title = relPath
    .split('/')
    .pop()
    ?.replace('.stories.tsx', '');

  const storyData: Pick<IStoryManifestItem, 'title' | 'stories'> = {
    title: title || '',
    stories: [],
  };

  parsed.body.forEach(node => {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration !== null) {
        const { type } = node.declaration;
        if (type === 'VariableDeclaration') {
          node.declaration.declarations.forEach(d => {
            const name = d.id.name;
            storyData.stories.push({
              name,
              key: name,
              id: `${id}_${name}`,
            });
          });
        }

        if (type === 'FunctionDeclaration') {
          const name = node.declaration.id.name;
          storyData.stories.push({
            name,
            key: name,
            id: `${id}_${name}`,
          });
        }
      }

      if (node.specifiers.length > 0) {
        node.specifiers.forEach(specifier => {
          const name = specifier.exported.name;
          if (!storyData.stories.includes(name)) {
            storyData.stories.push({
              name,
              key: name,
              id: `${id}_${name}`,
            });
          }
        });
      }
    }
  });

  const defaultExport = parsed.body.find(node => node.type === 'ExportDefaultDeclaration');

  if (defaultExport) {
    defaultExport.declaration.properties.forEach(property => {
      const key = property.key.name;
      const value = property.value.value;

      storyData[key] = value;
    });
  }

  storyManifest.files[id] = {
    id,
    fullPath,
    relativePath: relPath,
  };

  const cachedFile = storyManifest.files[id];

  cachedFile.title = storyData.title;
  cachedFile.stories = storyData.stories;

  const storyManifestAsString = JSON.stringify(storyManifest, null, '\t');

  fs.writeFileSync(manifestFilePath, storyManifestAsString, {
    encoding: 'utf-8',
  });

  writeStoriesJSFile(config);
}

export { saveStoryDataAtPath };
