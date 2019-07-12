import initStoryshots from '@storybook/addon-storyshots';
import path from 'path';
jest.setTimeout(30000);

initStoryshots({
  suite: 'JSON-APIs',
  configPath: path.resolve(__dirname, 'config-APIs.js'),
});
