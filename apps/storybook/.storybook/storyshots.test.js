import initStoryshots from '@storybook/addon-storyshots';
import { imageSnapshot } from '@storybook/addon-storyshots-puppeteer';
import path from 'path';

initStoryshots({
  suite: 'JSON',
});

if (process.env.BABEL_ENV === 'test:web') {
  const storybookUrl = process.env.IS_EXPO_CI
    ? 'file://' + path.resolve(__dirname, '..', 'storybook-static')
    : 'http://localhost:6006/';
  initStoryshots({
    suite: 'Image',
    test: imageSnapshot({
      storybookUrl,
    }),
  });
}
