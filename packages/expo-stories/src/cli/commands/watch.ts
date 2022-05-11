import sane from 'sane';

import { StoryOptions } from '../../types';
import { addStoriesAsync } from '../addStoriesAsync';
import { removeStoryAsync } from '../removeStoryAsync';

export async function watchAsync(config: StoryOptions) {
  const { watchRoots, projectRoot } = config;

  for (const watchRoot of watchRoots) {
    const watcher = sane(watchRoot, {
      glob: ['**/*.stories.tsx', '**/*.stories.js', '**/*.stories.ts', '**/*.stories.jsx'],
      ignored: ['node_modules'],
      watchman: true,
    });

    // fast refresh will capture any changes to a file
    // any other listeners would need to go through websockets
    // watcher.on('change', relPath => {
    // });

    watcher.on('add', async function (relPath: string) {
      await addStoriesAsync([relPath], { watchRoot, projectRoot });
      console.log(`Added ${relPath} file to stories`);
    });

    watcher.on('delete', async function (relPath: string) {
      await removeStoryAsync(relPath, { watchRoot, projectRoot });
      console.log(`Removed ${relPath} file from stories`);
    });

    watcher.on('ready', () => {
      console.log(`Watching for changes in ${watchRoot}`);
    });
  }
}
