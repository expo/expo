import path from 'path';
import Request from 'request-promise-native';

import { User, ProjectUtils, Project, ProjectSettings, Simulator } from 'xdl';

const request = Request.defaults({
  resolveWithFullResponse: true,
});
const XDL_CLIENT_ID = 'Zso9S1J7xpRYzT4QNlanGYLL5aBrqy1l'; // This is `exp`'s client ID
const XDL_LOGIN_USERPASS = {
  username: 'exponent_ci_bot',
  password: 'imabot2017',
};

export async function ios(Log, { root = '.', 'ios-sim-app-url': iosSimAppUrl }) {
  const testSuitePath = path.resolve(root);

  Log.collapsed('log in as exponent_ci_bot');
  await User.initialize(XDL_CLIENT_ID);
  await User.loginAsync('user-pass', XDL_LOGIN_USERPASS);

  Log.collapsed('start packager');
  ProjectUtils.attachLoggerStream(testSuitePath, {
    type: 'raw',
    stream: {
      write: chunk => console.log(chunk.msg.replace(/\n$/, '')),
    },
  });
  const packagerStarted = new Promise(resolve => {
    ProjectUtils.attachLoggerStream(testSuitePath, {
      type: 'raw',
      stream: {
        write: chunk => {
          if (chunk.tag !== 'metro') {
            return;
          }

          let payload;
          try {
            payload = JSON.parse(chunk.msg);
          } catch (e) {
            return;
          }

          if (
            payload.type === 'initialize_packager_done' /* SDK <=22 */ ||
            payload.type === 'initialize_done'
          ) {
            resolve();
          }
        },
      },
    });
  });
  await Project.startAsync(testSuitePath);
  await packagerStarted;

  Log.collapsed('get url');
  const settings = await ProjectSettings.readPackagerInfoAsync(testSuitePath);
  const url = `exp://localhost:${settings.expoServerPort}`;
  console.log(`URL is ${url}`);

  Log.collapsed('sanity check manifest');
  const manifestResponse = await request.get({
    url: url.replace(/^exp/, 'http'),
  });
  const manifest = JSON.parse(manifestResponse.body);
  if (!manifest.name === 'test-suite') {
    throw new Error('Bad name in test-suite manifest');
  }

  if (iosSimAppUrl) {
    Log.collapsed(`install '${iosSimAppUrl}' in simulator`);
    await Simulator._openSimulatorAsync();
    await Simulator._uninstallExponentAppFromSimulatorAsync();
    await Simulator._installExponentOnSimulatorAsync(iosSimAppUrl);
    await Simulator._waitForExponentAppInstalledOnCurrentBootedSimulatorAsync();
  }

  Log.collapsed('open in simulator');
  await Simulator.openUrlInSimulatorSafeAsync(url);

  // Wait for and parse results
  const allDone = new Promise(resolve => {
    ProjectUtils.attachLoggerStream(testSuitePath, {
      type: 'raw',
      stream: {
        write: chunk => {
          if (chunk.msg.indexOf('[TEST-SUITE-END]') >= 0) {
            resolve(JSON.parse(chunk.msg));
          }
        },
      },
    });
  });
  const results = await allDone;
  await Project.stopAsync(testSuitePath);
  process.exit(results.failed);
}
