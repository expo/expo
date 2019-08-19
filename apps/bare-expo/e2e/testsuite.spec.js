import * as detox from 'detox';
import chalk from 'chalk';
import { start, stop } from '../relapse/server';
const { device, expect: detoxExpect, element, by, waitFor } = detox;

let TESTS = [
  'AppAuth',
  // 'Basic',

  // 'Asset',
  // 'Constants',
  // 'Crypto',
  // 'FileSystem',
  // 'GLView',
  // 'Haptics',
  // 'Localization',
  // 'Recording',
  // 'ScreenOrientation',
  // 'SecureStore',
  // 'Segment',
  // 'Speech',
  // 'SQLite',
  // 'Random',
  // 'Payments',

  // 'AdMobInterstitial',
  // 'AdMobBanner',
  // 'AdMobPublisherBanner',
  // 'AdMobRewarded',
  // 'FBBannerAd',
  // 'FBNativeAd',

  // 'GoogleSignIn',
  // 'Location',
  // 'Linking',
  // 'Calendar',
  // 'Contacts',
  // 'Permissions',
  // 'MediaLibrary',
  // 'Notifications',
  // 'Brightness',
  // 'Video',
  // 'TaskManager',
  // 'Audio',
  // 'Camera',
  // 'JSC',
  // 'BarCodeScanner',
];

const sleep = t => new Promise(res => setTimeout(res, t));

// const WebSocket = require('ws');

// const wss = new WebSocket.Server({ port: 8085 });
// wss.on('connection', ws => {
//   ws.on('message', message => {
//     console.log(`Received message => ${message}`);
//   });
//   ws.send('green');
// });

beforeAll(async () => {
  const API = {
    device,
    detox,
    console,
  };
  TESTS = await new Promise(resolve => {
    start({
      onEvent: (fcName, props) => {
        const [globb, methd] = fcName.split('.');
        if (globb === 'expoRunner') {
          console.log('GOT MODULES: ', props[0]);
          resolve(props[0]);
          return;
        }
        console.log(
          '[BACON]: Fire cross-env global: ',
          // API[globb],
          // API[globb][methd],
          fcName,
          props
        );
        API[globb][methd](...props);
        // eval(`${fcName}(${props[0]})`);
      },
    }); // start the detox-jest-spy server

    device.launchApp({
      newInstance: true,
      url: `bareexpo://test-suite/select/`,
    });
  });
});

afterAll(() => {
  // wss.close();

  stop(); // stop the server after test run is complete
});

const MIN_TIME = 50000;
describe('test-suite', () => {
  TESTS.map(testName => {
    it(
      `passes ${testName}`,
      async () => {
        await device.launchApp({
          newInstance: true,
          url: `bareexpo://test-suite/select/${testName}`,
          // TODO(Bacon): Complex Localization testing
          // languageAndLocale: {
          //   language: locale,
          //   locale
          // }
        });

        // await device.openURL({
        //   url: `bareexpo://test-suite/select/${testName}`,
        //   // sourceApp: 'dev.expo.Payments',
        // });

        await sleep(100);
        // await device.reloadReactNative();

        await detoxExpect(element(by.id('test_suite_container'))).toBeVisible();
        await waitFor(element(by.id('test_suite_text_results')))
          .toBeVisible()
          .withTimeout(MIN_TIME);

        const resultsString = await readVisibleText('test_suite_final_results');

        const { magic, failed, failures, results } = JSON.parse(resultsString);
        expect(magic).toBe('[TEST-SUITE-END]');
        expect(results).toBeDefined();

        const formatResults = results =>
          results &&
          results
            // Remove random "undefined" from beginning
            .substring(9)
            .replace(new RegExp('---', 'g'), chalk.cyan('---'))
            .split('+++')
            .join(chalk.red('+++'))
            .split(` ${testName} `)
            .join(chalk.magenta.bold(` ${testName} `))
            .replace(new RegExp('toBe: ', 'g'), chalk.bold.green('toBe: '));
        console.log(chalk.bgMagenta.bold.black(`\n RESULTS \n\n`), formatResults(results));

        if (failed > 0) {
          console.log(chalk.bgRed.bold.black('\n FAILED \n\n'), formatResults(failures));
        }
        expect(failed).toBe(0);
      },
      MIN_TIME * 1.5
    );
  });
});

const readVisibleText = async testID => {
  try {
    await detoxExpect(element(by.id(testID))).toHaveText('_unfoundable_text');
    throw new Error('We never should get here unless target element has unfoundable text');
  } catch (error) {
    if (device.getPlatform() === 'ios') {
      const start = `accessibilityLabel was "`;
      const end = '" on ';
      const errorMessage = error.message.toString();
      const [, restMessage] = errorMessage.split(start);
      const [label] = restMessage.split(end);
      return label;
    } else {
      // Android to be tested
      const start = 'Got:';
      const end = '}"';
      const errorMessage = error.message.toString();
      const [, restMessage] = errorMessage.split(start);
      const [label] = restMessage.split(end);
      const value = label.split(',');
      var combineText = value.find(i => i.includes('text=')).trim();
      const [, elementText] = combineText.split('=');
      return elementText;
    }
  }
};
