const puppeteer = require('puppeteer');

async function newPageAsync(browser, onError) {
  const page = await browser.newPage();

  async function exitOnErrorAsync(msg) {
    await browser.close();
    onError(new Error('Page threw an error: ' + msg));
  }
  page.on('pageerror', async msg => {
    console.error('pageerror', msg);
    exitOnErrorAsync(msg);
  });
  page.on('error', async msg => {
    console.error('error', msg);
    exitOnErrorAsync(msg);
  });
  return page;
}

async function screenshotElementsAsync(page, opts = {}) {
  const selector = opts.selector;

  if (!selector) throw Error('Please provide a selector.');

  const rects = await page.evaluate(selector => {
    return [...document.querySelectorAll(selector)].map(element => {
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return {
        x,
        y,
        width,
        height,
        label: element.getAttribute('aria-label'),
      };
    });
  }, selector);

  if (!rects || !rects.length) {
    throw Error(`Could not find element that matches selector: ${selector}.`);
  }

  return await Promise.all(
    rects.map(async rect => {
      return {
        ...rect,
        buffer: await page.screenshot({
          clip: rect,
        }),
      };
    })
  );
}

async function getPageAsync(reject) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await newPageAsync(browser, reject);
  return page;
}

module.exports = {
  newPageAsync,
  screenshotElementsAsync,
  getPageAsync,
};
