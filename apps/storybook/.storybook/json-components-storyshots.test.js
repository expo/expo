import initStoryshots from '@storybook/addon-storyshots';
import path from 'path';
jest.setTimeout(30000);

initStoryshots({
  suite: 'JSON-Components',
  configPath: path.resolve(__dirname, 'config-Components.js'),
});
