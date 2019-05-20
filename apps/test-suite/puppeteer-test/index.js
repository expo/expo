const process = require('process');
const puppeteer = require('puppeteer');

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const getConfig = require('../webpack.ci');

const config = getConfig({ development: true });

const { devServer = {} } = config;

const options = {
  ...devServer,
  hot: true,
  inline: true,
  stats: { colors: true },
};

const port = 19003;

const manuallyRunWebpack = true;

let server;

async function runPuppeteerAsync() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  async function exitOnErrorAsync() {
    await browser.close();

    if (server) {
      server.close();
    }
    process.exit(1);
  }
  page.on('pageerror', async msg => {
    console.error('pageerror', msg);
    exitOnErrorAsync();
  });

  page.on('error', async msg => {
    console.error('error', msg);
    exitOnErrorAsync();
  });

  // 3. Parse a JSHandle into: { value: any, type: string }
  function parseHandle(jsHandle) {
    return jsHandle
      .executionContext()
      .evaluate(obj => ({ value: obj, type: typeof obj }), jsHandle);
  }

  // 1. Observe all console logs on the page
  page.on('console', async msg => {
    // 2. Filter the results into a list of objects
    const args = await Promise.all(msg.args().map(arg => parseHandle(arg)));
    console.log(args);

    // 4. Ignore anything that isn't an object - in test-suite we are sending the results as an object.
    const jsonObjects = args.filter(({ type }) => type === 'object');
    if (jsonObjects.length) {
      // 5. Unsafe - filter the objects whose magic prop is '[TEST-SUITE-END]'
      const { value: results } = args.filter(({ value }) => {
        return value.magic === '[TEST-SUITE-END]';
      })[0];
      // 6. Print this for Circle CI debugging if the tests fail
      console.log(results);

      // 7. Close the browser and the webpack server
      await browser.close();

      if (server) {
        server.close();
      }

      // 8. If there were any errors, then kill the process with non-zero for CI
      if (results.failed === 0) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    }
  });

  await page.goto(`http://localhost:${port}/all`, {
    timeout: 3000000,
  });
  console.log('Start observing test-suite');
}

function listenToServerAsync(server) {
  return new Promise((resolve, reject) => {
    server.listen(port, 'localhost', async function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function main(args) {
  if (manuallyRunWebpack) {
    try {
      server = new WebpackDevServer(webpack(config), options);
      await listenToServerAsync(server);
      console.log('WebpackDevServer listening at localhost:', port);
    } catch (error) {
      process.exit(1);
      return;
    }
  }

  try {
    await runPuppeteerAsync();
  } catch (error) {
    // Exit when puppeteer fails to startup - this will make CI tests evaluate faster
    // Example: Failed to launch chrome!
    console.log(error);

    if (server) {
      server.close();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}
