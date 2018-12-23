const puppeteer = require('puppeteer');

describe('TestSuite', async () => {
  test('Loads correctly', async () => {
    let browser = await puppeteer.launch({
      // headless: false,
    });
    let page = await browser.newPage();
    await page.goto('http://localhost:8080/');
    await page.screenshot({ path: './screenshots/example.png' });

    // await page.waitForSelector('.test_suite_container');

    // const html = await page.$eval('.test_suite_container', e => e.innerHTML);
    // expect(html).toBe('Some Value');
    browser.close();
  }, 16000);
});
