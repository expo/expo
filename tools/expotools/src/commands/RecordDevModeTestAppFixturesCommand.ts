import path from 'path';
import fs from 'fs';
import { Project, ProjectUtils } from 'xdl';
import spawnAsync from '@expo/spawn-async';

import { Directories, Fixtures } from '../expotools';

const STATE_INITIAL = 0;
const STATE_FINISHED_FIRST_LOAD = 1;

async function _rewriteAppJsFileAsync(projectDir, text) {
  let appJsFile = path.join(projectDir, 'App.js');
  let appJs = fs.readFileSync(appJsFile).toString();
  appJs = appJs.replace(/<Text>\w+<\/Text>/g, `<Text>${text}<\/Text>`);
  fs.writeFileSync(appJsFile, appJs);
}

async function action(options) {
  console.log('Starting project...');
  let projectDir = path.join(Directories.getExpoRepositoryRootDir(), 'apps', 'dev-mode-test');
  await spawnAsync('yarn', {
    cwd: projectDir,
  });
  _rewriteAppJsFileAsync(projectDir, 'INITIAL_STATE');
  await Project.startAsync(projectDir);
  await Fixtures.startRecordingAsync(projectDir, false, options.file || 'devModeFixture.txt');

  let currentState = STATE_INITIAL;
  ProjectUtils.attachLoggerStream(projectDir, {
    type: 'raw',
    stream: {
      write: async chunk => {
        if (chunk.msg.includes('DEV_MODE_TEST_FINISHED_LOADING')) {
          console.log('Detected that app finished loading');

          if (currentState === STATE_INITIAL) {
            console.log('Triggering a live reload...');
            Fixtures.recordFindTextOnScreenEvent('INITIAL_STATE');
            currentState = STATE_FINISHED_FIRST_LOAD;
            await _rewriteAppJsFileAsync(projectDir, 'AFTER_LIVE_RELOAD');
            console.log(
              `Sometimes triggering a live reload doesn't work. If it's not happening please run 'touch ${path.join(
                projectDir,
                'App.js'
              )}'`
            );
          } else {
            console.log('Shutting down...');
            Fixtures.recordFindTextOnScreenEvent('AFTER_LIVE_RELOAD');
            await Project.stopAsync(projectDir);
            await _rewriteAppJsFileAsync(projectDir, 'INITIAL_STATE');

            process.exit(0);
          }
        }
      },
    },
  });

  console.log('Scan the QR code with a device to start recording fixtures');
}

export default program => {
  program
    .command('record-dev-mode-test-app-fixtures')
    .description('Records fixtures from apps/dev-mode-test')
    .option('--file [path]', 'Specify the output path')
    .asyncAction(action);
};
