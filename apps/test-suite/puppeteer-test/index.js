const process = require('process');

const webpackConfig = require('@expo/webpack-config');
const startProjectAsync = require('./startProjectAsync');
const runPuppeteerTestAsync = require('./runPuppeteerTestAsync');
const runVisualTestAsync = require('./runVisualTestAsync');

async function main(args) {
  let server;
  try {
    const serverInfo = await startProjectAsync(webpackConfig);
    server = serverInfo.server;
    const { url } = serverInfo;
    await runPuppeteerTestAsync(url);
    await runVisualTestAsync(url, ['BlurView', 'LinearGradient']);
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
