import initStoryshots from '@storybook/addon-storyshots';
import { imageSnapshot } from '@storybook/addon-storyshots-puppeteer';
import path from 'path';
// In the build command we export a variable which helps us detect a web env.
// visual regression testing only works in the browser
if (process.env.BABEL_ENV === 'test:web' && !process.env.IS_EXPO_CI) {
  // Locally it's better to start the server and then run the tests.
  // In CI we want to build a static bundle and test against that.
  // const storybookUrl = 'file://' + path.resolve(__dirname, '..', 'web-build')
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
    fullPage: true,
    // omitBackground: true
  });

  const getGotoOptions = () => ({
    waitUntil: 'networkidle0',
    timeout: 5000,
  });

  const devices = require('puppeteer/DeviceDescriptors');

  // const device = devices['iPad Pro'];
  const device = devices['iPhone X'];

  function customizePage(page) {
    return page.emulate(device);
  }

  initStoryshots({
    suite: 'Image-APIs',
    configPath: path.resolve(__dirname, 'config-APIs.js'),
    test: imageSnapshot({
      storybookUrl,
      getMatchOptions,
      getScreenshotOptions,
      getGotoOptions,
      customizePage,
    }),
  });

  initStoryshots({
    suite: 'Image-Components',
    configPath: path.resolve(__dirname, 'config-Components.js'),

    test: imageSnapshot({
      storybookUrl,
      getMatchOptions,
      getScreenshotOptions,
      getGotoOptions,
      customizePage,
    }),
  });
}
