import glob from 'glob';

import { StoryOptions } from '../../types';
import { addStoriesAsync } from '../addStoriesAsync';

export async function buildAsync(config: StoryOptions) {
  const { watchRoot } = config;

  const relPaths = glob.sync('**/*.stories.{tsx,ts,js,jsx}', {
    cwd: watchRoot,
    ignore: ['**/node_modules/**', '**/ios/**', '**/android/**'],
  });

  await addStoriesAsync(relPaths, config);
}
