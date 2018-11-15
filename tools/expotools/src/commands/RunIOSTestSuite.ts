import process from 'process';

import { IOSSimulatorTestSuite } from '../expotools';

async function action(options) {
  let results = await IOSSimulatorTestSuite.runTestSuiteOnIOSSimulatorAsync(
    options.simulatorId,
    options.archivePath,
    options.reportPath
  );
  process.exit(results.failed === 0 ? 0 : 1);
}

export default program => {
  program
    .command('run-ios-test-suite')
    .option(
      '--simulatorId [string]',
      'Install and run the test suite in a specific simulator (defaults to "booted")'
    )
    .option('--archivePath <string>', 'Install and run the iOS app from the .app archive')
    .option('--reportPath [string]', 'Write a JUnit-formatted report of the test results to a file')
    .description('Installs and runs test-suite in a simulator and collects its results')
    .asyncAction(action);
};
