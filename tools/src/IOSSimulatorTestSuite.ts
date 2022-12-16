import JUnitReportBuilder from 'junit-report-builder';
import path from 'path';

import * as IOSSimulator from './IOSSimulator';
import * as Log from './Log';

const TEST_SUITE_BUNDLE_ID = 'io.expo.testsuite';
const TEST_SUITE_END_SENTINEL = '[TEST-SUITE-END]';

// Keep this type in sync with test-suite
type TestSuiteResults = {
  failed: number;
  failures: string;
};

export async function runTestSuiteOnIOSSimulatorAsync(simulatorId, archivePath, reportPath) {
  Log.collapsed(`Running test-suite on the iOS simulator`);
  if (!simulatorId) {
    console.log(`Starting a new simulator`);
    await IOSSimulator.startSimulatorAsync();
    simulatorId = 'booted';
  }

  console.log(`Installing test-suite on the simulator`);
  await IOSSimulator.installSimulatorAppAsync(simulatorId, path.resolve(archivePath));
  console.log(`Streaming logs from the simulator`);
  const resultsPromise = _streamSimulatorLogsAsync(simulatorId);
  console.log(`Launching the test-suite app and waiting for tests to complete`);
  await IOSSimulator.launchSimulatorAppAsync(simulatorId, TEST_SUITE_BUNDLE_ID);

  const results = await resultsPromise;
  if (results.failed === 0) {
    console.log(`😊 All tests passed`);
  } else {
    console.error(`😣 ${results.failed} ${results.failed === 1 ? 'test' : 'tests'} failed`);
  }

  if (reportPath) {
    _writeJUnitReport(results, reportPath);
    console.log(`Saved test results to ${reportPath}`);
  }

  return results;
}

function _streamSimulatorLogsAsync(simulatorId: string): Promise<TestSuiteResults> {
  return new Promise((resolve, reject) => {
    const logProcess = IOSSimulator.getSimulatorLogProcess(
      simulatorId,
      '(subsystem == "host.exp.Exponent") && (category == "test")'
    );
    const logStream = new IOSSimulator.IOSLogStream();
    logProcess.stdout.pipe(logStream);

    logStream.on('data', (entry) => {
      // Show the log messages in the CI log
      console.log(entry.eventMessage);

      if (!entry.eventMessage.startsWith(TEST_SUITE_END_SENTINEL)) {
        return;
      }

      try {
        logStream.removeAllListeners('data');

        const resultsJson = entry.eventMessage.substring(TEST_SUITE_END_SENTINEL.length).trim();
        const results = JSON.parse(resultsJson);
        resolve(results);
      } catch (e) {
        reject(e);
      } finally {
        console.log(`Terminating simulator log stream`);
        logProcess.kill('SIGTERM');
      }
    });
  });
}

function _writeJUnitReport(results: TestSuiteResults, reportPath: string): void {
  const builder = JUnitReportBuilder.newBuilder();
  // let suite = builder.testSuite().name('Test Suite');

  // TODO: parse the results

  builder.writeTo(reportPath);
}
