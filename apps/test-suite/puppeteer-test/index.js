const process = require('process');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { Webpack, ProjectSettings } = require('@expo/xdl');

const manuallyRunWebpack = true;

let server;

async function runPuppeteerAsync() {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox'],
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

    for (const log of args) {
      console.log(log.value);
    }

    // 4. Ignore anything that isn't an object - in test-suite we are sending the results as an object.
    const jsonObjects = args.filter(({ type }) => type === 'object');
    if (jsonObjects.length) {
      // 5. Unsafe - filter the objects whose magic prop is '[TEST-SUITE-END]'
      const { value: results } = args.filter(({ value }) => {
        return value.magic === '[TEST-SUITE-END]';
      })[0];
      // 6. Print this for Circle CI debugging if the tests fail
      console.log(results.results);

      // 7. Close the browser and the webpack server
      await browser.close();

      if (server) {
        server.close();
      }

      // 8. If there were any errors, then kill the process with non-zero for CI
      if (results.failed === 0) {
        console.log('Passed!');
        process.exit(0);
      } else {
        console.log('Failed: ', results.failed);
        process.exit(1);
      }
    }
  });

  await page.goto(`${url}/all`, {
    timeout: 3000000,
  });
  console.log('Start observing test-suite');
}

let url;

async function main(args) {
  if (manuallyRunWebpack) {
    try {
      const projectRoot = fs.realpathSync(path.resolve(__dirname, '..'));
      await ProjectSettings.setAsync(projectRoot, { https: true });

      const info = await Webpack.startAsync(projectRoot, { nonInteractive: true }, true);

      server = info.server;
      url = info.url;
      // await listenToServerAsync(server);
      console.log('WebpackDevServer listening at localhost:', url.split(':').pop());
    } catch (error) {
      console.log('Runner Error: ', error.message);
      process.exit(1);
      return;
    }
  }

  try {
    await runPuppeteerAsync();
  } catch (error) {
    // Exit when puppeteer fails to startup - this will make CI tests evaluate faster
    // Example: Failed to launch chrome!
    console.log('Runner Error: ', error.message);

    if (server) {
      server.close();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}
