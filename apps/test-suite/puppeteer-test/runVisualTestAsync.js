const chalk = require('chalk');
const fs = require('fs-extra');
const { getPageAsync, screenshotElementsAsync } = require('./PuppeteerUtils');
const { compareImagesAsync } = require('./ImageUtils');

async function visuallyTestElementsOnPageAsync(page, pageName) {
  return new Promise(async (resolve, reject) => {
    const outputFolder = 'snapshots'; // path.dirname(parentModule());
    const elements = await screenshotElementsAsync(page, {
      selector: `[aria-label^='target-']`,
    });

    console.log(chalk.bold(pageName));
    console.log(chalk.white(`Found ${elements.length} elements to test on the ${pageName} screen`));
    fs.ensureDirSync(outputFolder);
    let failed = [];

    await Promise.all(
      elements.map(async rect => {
        try {
          await compareImagesAsync({
            currentImageBuffer: rect.buffer,
            outputFolder,
            fileName: `snap_${pageName}_${rect.label}`,
          });
          console.log(chalk.green(`  ✅ ${rect.label} matched!`));
        } catch (error) {
          console.log(chalk.red(`  ❌ ${rect.label} did not match`));

          failed.push(error);
        }
      })
    );

    resolve(failed);
  });
}

async function runVisualTestOnPagesAsync(url, pagesToTest) {
  return new Promise(async (resolve, reject) => {
    const failed = await Promise.all(
      pagesToTest.map(async pageName => {
        const pageUrl = `${url}/${pageName}`;
        const page = await getPageAsync(reject);

        await page.goto(pageUrl, {
          waitUntil: 'networkidle2',
        });

        const failed = await visuallyTestElementsOnPageAsync(page, pageName);
        return failed;
      })
    );

    if (failed.filter(results => results.length).length) {
      reject(new Error());
    } else {
      resolve();
    }
  });
}

module.exports = runVisualTestOnPagesAsync;
