const process = require('process');

const webpackConfig = require('@expo/webpack-config');
const startProjectAsync = require('./startProjectAsync');
const runPuppeteerTestAsync = require('./runPuppeteerTestAsync');
const runVisualTestAsync = require('./runVisualTestAsync');

async function main(args) {
  let server;
  try {
    console.time('Start Webpack');
    const serverInfo = await startProjectAsync(webpackConfig);
    server = serverInfo.server;
    const { url } = serverInfo;
    console.timeEnd('Start Webpack');
    console.time('Unit Test');
    await runPuppeteerTestAsync(url);
    console.timeEnd('Unit Test');
    console.time('Visual Test');
    await runVisualTestAsync(url, [
      'Svg',
      'Rect',
      'Circle',
      'Ellipse',
      'Line',
      'Polygon',
      'Polyline',
      'Path',
      'Text',
      'TextStroke',
      'Stroking',
      'G',
      'Gradients',
      'Clipping',
      'Image',
      'Reusable',
      'Font',
      'ImageManipulator',
      'ViewShot',
      'BlurView',
      'LinearGradient',
    ]);
    console.timeEnd('Visual Test');
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  } finally {
    // Exit when puppeteer fails to startup - this will make CI tests resolve faster
    // Example: Failed to launch chrome!
    if (server) {
      server.close();
    }
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}
