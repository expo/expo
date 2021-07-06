# jest-expo-puppeteer

Run end-to-end tests on your Expo web projects with [Jest][jest], [Puppeteer][puppeteer], and the [Expo CLI][expo-cli].
This library wraps [`jest-puppeteer`][jest-puppeteer] and reads info from your project's `app.json` to configure it correctly for development and production builds. This library will automatically configure your project to run Puppeteer correctly in CI.

## Installation

- `yarn add jest-expo-puppeteer puppeteer --dev` or `npm i jest-expo-puppeteer puppeteer --save-dev`
- Add the following config to `package.json`:

  ```js
  "scripts": {
    "test": "jest",
    "test:prod": "EXPO_WEB_E2E_ENV=production jest"
  },
  "jest": {
    // You should use jest-expo-puppeteer as your preset which wraps jest-puppeteer and adds minor changes (subject to change in the future)
    "preset": "jest-expo-puppeteer"
    // You could also just use `jest-puppeteer` preset but this may have unexpected behavior
    "preset": "jest-puppeteer"
  }
  ```

- Create a `jest-puppeteer.config.js` file in your root directory:

  ```js
  // For testing
  const { withExpoPuppeteer } = require('jest-expo-puppeteer');

  module.exports = withExpoPuppeteer({
    // Configure...
  });
  ```

- Create a `__tests__` directory anywhere you like and a `Example-test.js` file inside of it, and add this code:

  ```js
  // Import the config so we can find the host URL
  import config from '../jest-puppeteer.config';

  let response;

  beforeEach(async () => {
    // Jest puppeteer exposes the page object from Puppeteer
    response = await page.goto(config.url);
  });

  it(`should match a text element`, async () => {
    // Target elements and test their properties
    await expect(page).toMatchElement('div[data-testid="basic-text"]', {
      text: 'Open up App.js to start working on your app!',
    });
  });
  ```

- Run `yarn test` and it should pass in development mode by starting `expo-cli`, `puppeteer`, and `jest` then executing the Jest tests

## Customization

You can customize the `jest-dev-server`, `puppeteer`, and `expo-cli` options from the `jest-puppeteer.config.js` file:

```js
const { withExpoPuppeteer } = require('jest-expo-puppeteer');

module.exports = withExpoPuppeteer({
  // development will run `expo start`
  // production will run `expo build:web` then serve the static bundle
  // this value can also be defined inline with `process.env.EXPO_WEB_E2E_ENV`
  // This is "development" by default
  mode: 'development' | 'production' | process.env.EXPO_WEB_E2E_ENV,
  // Used with `mode: 'production'` to skip the build phase if the output folder exists.
  // This is useful for debugging. This is false by default
  preventRebuild: boolean,
  // The relative path for the expo project you want to run. This is `process.cwd()` by default (root directory)
  projectRoot: string,

  // The jest dev server config options: https://github.com/smooth-code/jest-puppeteer/tree/master/packages/jest-dev-server#options
  server: Object,

  // The rest of the puppeteer config options: https://github.com/smooth-code/jest-puppeteer#configure-puppeteer
  ...jestPuppeteerConfig,
});
```

## Running in watch mode

Because [jest-puppeteer doesn't start the server in watch mode](https://github.com/smooth-code/jest-puppeteer/issues/229) you will need to start the Webpack server manually. A simple way to do this is by opening a new terminal window and running: `WEB_PORT=5000 expo start:web --https`. For SSR you'll need to change the port to `8000`.

If you get the error `"start:web" is not an expo command. See "expo --help" for the full list of commands.` then you may need to update **expo-cli** (`npm i -g expo-cli`) or use the older command `expo start --web-only`.

## Usage in Circle CI

This library is built to work with continuous integration, just ensure you are using a Docker image that works with Puppeteer, ex: `circleci/node:latest-browsers`

```yml
jobs:
  web:
    # A Docker image that works with Puppeteer
    docker:
      - image: circleci/node:latest-browsers
    shell: /bin/bash -leo pipefail
    resource_class: small
    environment:
      USER: circleci
    steps:
      - checkout
      # Running this preset will check for the existence of node modules before running.
      - run: yarn test
```

## Resources

[Jest documentation][jest]
[Jest Puppeteer documentation][jest-puppeteer]
[Puppeteer][puppeteer]
[`server` options](https://github.com/smooth-code/jest-puppeteer/tree/master/packages/jest-dev-server#options)
[`connect` options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerconnectoptions)
[`launch` options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions)

[jest]: https://facebook.github.io/jest/
[jest-puppeteer]: https://github.com/smooth-code/jest-puppeteer
[puppeteer]: https://github.com/GoogleChrome/puppeteer
[expo-cli]: https://github.com/expo/expo-cli
