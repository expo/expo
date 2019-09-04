/* global page */
import { boolish } from 'getenv';
import config from '../../jest-puppeteer.config';

let response;
beforeEach(async () => {
  response = await page.goto(config.url);
});

it(`should match a text element`, async () => {
  await expect(page).toMatchElement('div[data-testid="basic-text"]', {
    text: 'Open up App.js to start working on your app!',
  });
});

if (config.hasServerSideRendering) {
  it(`should match a text element server-side`, async () => {
    const sourceCode = await response.text();
    expect(sourceCode).toEqual(
      expect.stringContaining('Open up App.js to start working on your app!')
    );
  });
}

if (boolish('CI', false)) {
  it(`should be aware of process.env.CI`, async () => {
    await expect(page).toMatchElement('div[data-testid="has-ci-text"]', {
      text: 'Has CI env',
    });
  });
}
