import path from 'path';
import process from 'process';

import { Fixtures } from '../expotools';

async function action(projectDir) {
  let projectRoot = path.resolve(process.cwd(), projectDir);
  await Fixtures.startRecordingAsync(projectRoot);
}

export default program => {
  program
    .command('record-fixtures [projectDir]')
    .description('Runs a proxy server over an Expo project that records all packager activity')
    .asyncAction(action);
};
