import puppeteer from 'puppeteer';

const url = process.argv[2];

if (!url) {
  console.error(`You need to provide the base URL for links as a parameter.`);
  process.exit(-1);
}

const externalLinks = [
  '/versions/latest/workflow/expo-cli/', // https://github.com/expo/expo-cli/blob/main/packages/expo-cli/README.md and https://github.com/expo/expo-cli/blob/main/README.md
  '/versions/latest/workflow/configuration/', // https://github.com/expo/expo-cli/blob/main/CONTRIBUTING.md and https://github.com/expo/expo-cli/blob/main/packages/expo-cli/src/commands/init.js and https://github.com/expo/expo-cli/blob/main/packages/xdl/src/project/Doctor.js
  // https://github.com/expo/expo-cli/blob/4e16a55e98e0612f71685ed16b3b5f8405219d4a/packages/xdl/README.md#xdl [Documentation](https://docs.expo.dev/versions/devdocs/index.html)
  '/versions/latest/distribution/building-standalone-apps/#2-configure-appjson', // https://github.com/expo/expo-cli/blob/main/packages/expo-cli/src/commands/build/AndroidBuilder.js
  '/versions/latest/distribution/building-standalone-apps/#if-you-choose-to-build-for-android', // https://github.com/expo/expo-cli/blob/main/packages/expo-cli/src/commands/build/AndroidBuilder.js
  '/versions/latest/workflow/linking/', // https://github.com/expo/expo-cli/blob/main/packages/xdl/src/detach/Detach.ts
  '/versions/latest/workflow/configuration/#ios', // https://github.com/expo/expo-cli/blob/main/packages/xdl/src/detach/Detach.js
  '/versions/latest/sdk/overview/', // https://github.com/expo/expo-cli/blob/main/packages/xdl/src/project/Convert.js
  '/versions/latest/distribution/building-standalone-apps/#2-configure-appjson', // https://github.com/expo/expo-cli/blob/main/packages/expo-cli/src/commands/build/ios/IOSBuilder.js
  '/versions/latest/introduction/faq/#can-i-use-nodejs-packages-with-expo', // https://github.com/expo/expo-cli/blob/main/packages/xdl/src/logs/PackagerLogsStream.js
];

(async () => {
  try {
    const notFound = [];
    const redirectsFailed = [];

    const browser = await puppeteer.launch({
      headless: 'shell',
      args: ['--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    for (const link of externalLinks) {
      const response = await page.goto(`${url}${link}`);
      if (response.status() === 404) {
        await page.waitForFunction(
          () => document.querySelector('#redirect-link') || document.querySelector('#__not_found'),
          { timeout: 500 }
        );
        if (await page.$('#redirect-link')) {
          await Promise.all([page.waitForNavigation(), page.click('#redirect-link')]);
          console.info(`Redirected from ${link} to ${page.url()}`);
          try {
            await page.waitForFunction(
              () =>
                document.querySelector('#__redirect_failed') ||
                document.querySelector('#__not_found'),
              { timeout: 500 }
            );
            console.debug(`Redirect failed`);
            redirectsFailed.push(link);
          } catch {
            console.debug(`Redirect successful`);
          }
        } else {
          console.debug(`Couldn't find ${link}`);
          notFound.push(link);
        }
      }
    }
    await browser.close();

    if (notFound.length || redirectsFailed.length) {
      if (notFound.length) {
        console.error(`Pages not found for links: ${notFound.join(',')}`);
      } else if (redirectsFailed.length) {
        console.error(`Redirects failed for links: ${redirectsFailed.join(',')}`);
      }
      process.exit(-1);
    }
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }
})();
