import initStoryshots from '@storybook/addon-storyshots';
import path from 'path';
jest.setTimeout(30000);

import { loadStory } from './config';

initStoryshots({
  suite: 'JSON-APIs',
  configPath: path.resolve(__dirname, 'config-APIs.js'),
});
