import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import glob from 'glob';
import http from 'http';
import path from 'path';
import sane from 'sane';
import ws from 'ws';

import { storiesFileDir } from './constants';
import { getConfig } from './getConfig';
import { IServerConfig, IStoryManifestItem } from './types';
import { writeRequiredFiles } from './writeRequiredFiles';

// TODO - figure out the best way to generate a pure id from filepath
//  needs to be a string with valid JS characters
function createId(data: string) {
  let id = crypto
    .createHash('sha256')
    .update(data)
    .digest('base64');

  id = id.replace(/[^a-zA-Z_]/gi, '');

  return id;
}

function startServer(serverConfig: IServerConfig) {
  const config = getConfig(serverConfig);

  const { projectRoot, port, watchRoot } = config;

  writeRequiredFiles(config);

  const manifestFilePath = path.resolve(projectRoot, storiesFileDir, 'storyManifest.json');
  const storyManifest = require(manifestFilePath);
  const storiesById = {};

  const results = glob.sync('**/*.stories.{tsx,ts,js,jsx}', {
    cwd: watchRoot,
    ignore: ['**/node_modules/**', '**/ios/**', '**/android/**'],
  });

  results.forEach(relPath => {
    saveStoryAtPath(relPath);
  });

  const watcher = sane(watchRoot, {
    glob: ['**/*.stories.tsx', '**/*.stories.js', '**/*.stories.ts', '**/*.stories.jsx'],
    ignored: ['node_modules'],
    watchman: true,
  });

  watcher.on('change', relPath => {
    saveStoryAtPath(relPath);
    refreshClients();

    console.log({ storyManifest });
  });

  watcher.on('add', relPath => {
    saveStoryAtPath(relPath);
    refreshClients();

    console.log({ storyManifest });
  });

  watcher.on('delete', function(relPath) {
    const fullPath = path.resolve(watchRoot, relPath);
    const id = createId(fullPath);

    delete storyManifest.files[id];
    const storyManifestAsString = JSON.stringify(storyManifest, null, '\t');

    fs.writeFileSync(manifestFilePath, storyManifestAsString, {
      encoding: 'utf-8',
    });

    console.log({ storyManifest });
    writeStoriesFile();
    refreshClients();
  });

  watcher.on('ready', () => {
    startApp();
    refreshClients();
    logStories();
  });

  const app = express();
  app.use(bodyParser.json());
  app.use(cors());
  const server = http.createServer(app);
  const wss = new ws.Server({ server });

  function getStories() {
    const stories = Object.keys(storyManifest.files).map(key => {
      return storyManifest.files[key];
    });

    return stories;
  }

  app.get('/stories', (req, res) => {
    const stories = getStories();
    res.json({ data: stories });
  });

  app.post(`/stories`, (req, res) => {
    const { type, payload } = req.body;

    if (type === 'selectStory') {
      const storyId: string = payload;
      const selectedStory = storiesById[storyId];

      if (selectedStory) {
        wss.clients.forEach(client => {
          if (client.readyState === ws.OPEN) {
            // TODO
          }
        });

        res.json({ data: selectedStory });
        return;
      }
    }

    if (type === 'clearStory') {
      wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
          const event = {
            type: 'clearStory',
          };

          client.send(JSON.stringify(event));
        }
      });

      res.json({ data: 'Cleared story' });
      return;
    }

    res.json({ data: 'Invalid story id provided!' });
  });

  server.on('close', cleanup);
  server.on('error', cleanup);

  function cleanup() {
    watcher.close();
  }

  function startApp() {
    server.listen(port, () => {
      console.log(`Listening on http://localhost:${port}`);
    });
  }

  function refreshClients() {
    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        const message = JSON.stringify({
          type: 'refreshStories',
          payload: undefined,
        });

        client.send(message);
      }
    });
  }

  function saveStoryAtPath(relPath: string) {
    const fullPath = path.resolve(watchRoot, relPath);
    const fileAsString = fs.readFileSync(fullPath, { encoding: 'utf-8' });
    const storyManifest = getStoryManifest(config);

    const id = createId(fullPath);
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

    writeStoriesFile();
  }

  function logStories() {
    const stories = getStories();
    console.log('Stories found: \n');
    console.log({ stories });
  }

  function writeStoriesFile() {
    const stories = getStories();

    function captureAndWriteStoryRequires() {
      return stories
        .map(story => {
          storiesById[story.id] = story;

          return `
            function ${story.id}Setup() {
              const stories = require("${story.fullPath}")
              const parentConfig = stories.default || {}
              parentConfig.id = "${story.id}"

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

    let template = `
      const storiesToExport = {}
      ${captureAndWriteStoryRequires()}
      module.exports = storiesToExport
    `;

    if (!process.env.EXPO_DEBUG) {
      template = require('esbuild').transformSync(template, {
        minify: true,
      }).code;
    }

    const storiesDir = path.resolve(projectRoot, storiesFileDir);
    const writeRequiresPath = path.resolve(storiesDir, 'stories.js');
    fs.writeFileSync(writeRequiresPath, template, { encoding: 'utf-8' });
  }

  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, () => {
      cleanup();
      server.close();
      process.exit(0);
    });
  });
}

function getStoryManifest(config: IServerConfig) {
  const manifestFilePath = path.resolve(config.projectRoot, storiesFileDir, 'storyManifest.json');
  const storyManifest = require(manifestFilePath);
  return storyManifest;
}

export { startServer };
