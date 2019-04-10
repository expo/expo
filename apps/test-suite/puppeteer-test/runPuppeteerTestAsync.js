const puppeteer = require('puppeteer');

module.exports = async function runPuppeteerAsync(url) {
  return new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    async function exitOnErrorAsync(msg) {
      await browser.close();
      reject(new Error('Page threw an error: ' + msg));
    }
    page.on('pageerror', async msg => {
      console.error('pageerror', msg);
      exitOnErrorAsync(msg);
    });

    page.on('error', async msg => {
      console.error('error', msg);
      exitOnErrorAsync(msg);
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

        // 8. If there were any errors, then kill the process with non-zero for CI
        if (results.failed === 0) {
          resolve();
        } else {
          reject(new Error('Failed ' + results.failed + ' tests'));
        }
      }
    });

    await page.goto(url, {
      timeout: 3000000,
    });
    console.log('Start observing test-suite');
  });
};
