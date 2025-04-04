import fs from 'fs/promises';

export type StartMode = 'BUILD' | 'TEST' | 'BUILD_AND_TEST';

/**
 * Parse the start mode from the command line arguments.
 */
export function getStartMode(programFilename: string): StartMode {
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
 */
export async function createMaestroFlowAsync({
  appId,
  workflowFile,
  confirmFirstRunPrompt,
}: {
  appId: string;
  workflowFile: string;
  confirmFirstRunPrompt?: boolean;
}): Promise<void> {
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
 */
export async function ensureDirAsync(dirPath: string) {
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
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  retries: number,
  delayAfterErrorMs: number = 5000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; ++i) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      await delayAsync(delayAfterErrorMs);
    }
  }
  throw lastError;
}

/**
 * Check if a file exists.
 */
export async function fileExistsAsync(file: string): Promise<boolean> {
  return (await fs.stat(file).catch(() => null))?.isFile() ?? false;
}

/**
 * Delay for a number of milliseconds.
 */
export async function delayAsync(timeMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}
