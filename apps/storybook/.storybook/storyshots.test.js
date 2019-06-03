import initStoryshots from '@storybook/addon-storyshots';
import { imageSnapshot } from '@storybook/addon-storyshots-puppeteer';
import path from 'path';

initStoryshots({
  suite: 'JSON',
});

// In the build command we export a variable which helps us detect a web env.
// visual regression testing only works in the browser
if (process.env.BABEL_ENV === 'test:web') {
  // Locally it's better to start the server and then run the tests.
  // In CI we want to build a static bundle and test against that.
  const storybookUrl = process.env.IS_EXPO_CI
    ? 'file://' + path.resolve(__dirname, '..', 'storybook-static')
    : 'http://localhost:6006/';

  // TODO: Bacon: Only capture the components, the description seems less than useful.
  const getMatchOptions = ({ context: { kind, story }, url }) => {
    return {
      failureThreshold: 0.2,
      failureThresholdType: 'percent',
    };
  };

  const getScreenshotOptions = ({ context, url }) => ({
    fullPage: true, // Do not take the full page screenshot. Default is 'true' in Storyshots.
  });

  const devices = require('puppeteer/DeviceDescriptors');

  const device = devices['iPad Pro'];
  // const device = devices['iPhone X'];

  function customizePage(page) {
    return page.emulate(device);
  }

  initStoryshots({
    suite: 'Image',
    test: imageSnapshot({
      storybookUrl,
      getMatchOptions,
      getScreenshotOptions,
      customizePage,
    }),
  });
}
