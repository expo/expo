const chalk = require('chalk');
const fs = require('fs-extra');
const { getPageAsync, screenshotElementsAsync } = require('./PuppeteerUtils');
const { compareImagesAsync } = require('./ImageUtils');
const puppeteer = require('puppeteer');

async function visuallyTestElementsOnPageAsync(page, pageName) {
  return new Promise(async (resolve, reject) => {
    const outputFolder = 'snapshots/' + pageName;
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
  let failed = [];
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  for (const pageName of pagesToTest) {
    const pageUrl = `${url}/${pageName}`;
    const page = await getPageAsync(browser, error => {
      throw error;
    });

    await page.goto(pageUrl, {
      waitUntil: 'networkidle2',
    });
    failed.push(await visuallyTestElementsOnPageAsync(page, pageName));
  }

  await browser.close();

  if (failed.filter(results => results.length).length) {
    throw new Error();
  }
}

module.exports = runVisualTestOnPagesAsync;
