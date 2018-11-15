import assert from 'assert';
import fse from 'fs-extra';
import path from 'path';

import { Log, TestSuite } from '../expotools';

async function action(options) {
  let url = await TestSuite.publishTestSuiteAsync();
  assert(url, `The published project must have a URL`);

  if (options.writeUrl) {
    Log.collapsed(`Writing published project URL to ${options.writeUrl}`);
    await fse.ensureDir(path.dirname(options.writeUrl));
    await fse.writeFile(options.writeUrl, url);
  }

  console.log(url);
}

export default (program: any) => {
  program
    .command('publish-test-suite')
    .option('--writeUrl [string]', 'Write the published project URL to a file')
    .description('Publishes the test-suite app from the Expo repository')
    .asyncAction(action);
};
