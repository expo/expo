// @ts-check

const fs = require('fs/promises');
const path = require('path');

/**
 * Parse the start mode from the command line arguments.
 * @param {string} programFilename
 * @returns {'BUILD' | 'TEST' | 'BUILD_AND_TEST'}
 */
function getStartMode(programFilename) {
  const programIndex = process.argv.findIndex((argv) => argv === programFilename);
  const startModeArg = process.argv[programIndex + 1];
  if (startModeArg === '--build') {
    return 'BUILD';
  }
  if (startModeArg === '--test') {
    return 'TEST';
  }
  return 'BUILD_AND_TEST';
}

/**
 * Generate Maestro flow yaml file
 * @param {{ appId: string; workflowFile: string; confirmFirstRunPrompt?: boolean; }} params
 * @returns {Promise<void>}
 */
async function createMaestroFlowAsync({ appId, workflowFile, confirmFirstRunPrompt }) {
  const inputFile = require('../../e2e/TestSuite-test.native.js');
  const testCases = inputFile.TESTS;
  const contents = [
    `\
appId: ${appId}
---
- clearState
`,
  ];

  if (confirmFirstRunPrompt) {
    contents.push(`\
# Run once to approve the first time deeplinking prompt
- openLink: bareexpo://test-suite/run
- tapOn:
    text: "Open"
    optional: true
- stopApp
`);
  }

  for (const testCase of testCases) {
    contents.push(`\
- openLink: bareexpo://test-suite/run?tests=${testCase}
- extendedWaitUntil:
    visible:
      id: "test_suite_text_results"
    timeout: 120000
- assertVisible:
    text: "Success!"
- stopApp
`);
  }

  await fs.writeFile(workflowFile, contents.join('\n'));
}

/**
 * Ensure a directory exists.
 * @param {string} dirPath
 */
async function ensureDirAsync(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}

/**
 * Retry an async function a number of times with a delay between each attempt.
 * @template T
 * @param {(retryNumber: number) => Promise<T>} fn
 * @param {number} retries
 * @param {number=} delayAfterErrorMs
 * @returns {Promise<T>}
 */
async function retryAsync(fn, retries, delayAfterErrorMs = 5000) {
  /** @types {Error | undefined} */
  let lastError;
  for (let i = 0; i < retries; ++i) {
    try {
      return await fn(i);
    } catch (e) {
      lastError = e;
      await delayAsync(delayAfterErrorMs);
    }
  }
  throw lastError;
}

/**
 * Check if a file exists.
 * @param {string} file
 * @returns {Promise<boolean>}
 */
async function fileExistsAsync(file) {
  return (await fs.stat(file).catch(() => null))?.isFile() ?? false;
}

/**
 * Delay for a number of milliseconds.
 * @param {number} timeMs
 * @returns {Promise<void>}
 */
async function delayAsync(timeMs) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}

/**
 * @param {string} projectRoot
 * @returns {string}
 */
const getMaestroFlowFilePath = (projectRoot) => {
  const MAESTRO_GENERATED_FLOW = 'e2e/maestro-generated.yaml';
  return path.join(projectRoot, MAESTRO_GENERATED_FLOW);
};

module.exports = {
  getStartMode,
  createMaestroFlowAsync,
  ensureDirAsync,
  fileExistsAsync,
  retryAsync,
  delayAsync,
  getMaestroFlowFilePath,
};
