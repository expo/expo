import { TestSuite } from '../expotools';

async function action(sdkVersion) {
  if (!sdkVersion) {
    throw new Error('SDK Version is required');
  }

  await TestSuite.publishVersionedTestSuiteAsync(sdkVersion);
}

export default (program) => {
  program
    .command('publish-versioned-test-suite [sdkVersion]')
    .description('Publishes Test Suite for a specific SDK version')
    .asyncAction(action);
};
