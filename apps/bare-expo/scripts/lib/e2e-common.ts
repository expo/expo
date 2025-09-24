import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs/promises';
import * as path from 'path';

export type StartMode = 'BUILD' | 'TEST' | 'BUILD_AND_TEST';

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

export interface MaestroFlowParams {
  appId: string;
  workflowFile: string;
  confirmFirstRunPrompt?: boolean;
}

export async function createMaestroFlowAsync({ appId, workflowFile, confirmFirstRunPrompt }: MaestroFlowParams): Promise<void> {
  const inputFile = await import('../../e2e/TestSuite-test.native.js');
  const testCases = inputFile.TESTS as string[];
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

export async function ensureDirAsync(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (e: any) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}

export async function retryAsync<T>(
  fn: (retryNumber: number) => Promise<T>,
  retries: number,
  delayAfterErrorMs: number = 5000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; ++i) {
    try {
      return await fn(i);
    } catch (e) {
      lastError = e as Error;
      await delayAsync(delayAfterErrorMs);
    }
  }
  throw lastError;
}

export async function fileExistsAsync(file: string): Promise<boolean> {
  return (await fs.stat(file).catch(() => null))?.isFile() ?? false;
}

export async function delayAsync(timeMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}

export const getMaestroFlowFilePath = (projectRoot: string): string => {
  const MAESTRO_GENERATED_FLOW = 'e2e/maestro-generated.yaml';
  return path.join(projectRoot, MAESTRO_GENERATED_FLOW);
};

export function prettyPrintTestSuiteLogs(logs: string[]) {
  const lastTestSuiteLog = logs.reverse().find((logItem) => logItem.includes('TEST-SUITE-END'));
  if (!lastTestSuiteLog) {
    return '';
  }
  const jsonPart = lastTestSuiteLog?.match(/{.*}/);
  if (!jsonPart || !jsonPart[0]) {
    return '';
  }
  const testSuiteResult = JSON.parse(jsonPart[0]);
  if ((testSuiteResult?.failures.length ?? 0) <= 0) {
    return '';
  }
  const result = [];
  result.push('  ❌ Test suite had following test failures:');
  testSuiteResult?.failures?.split('\n').forEach((failure) => {
    if (failure.length > 0) {
      result.push(`    ${failure}`);
    }
  });
  return result.join('\n');
}

export function setupLogger(command: string, signal: AbortSignal): () => Promise<string[]> {
  const [cmd, ...params] = command.split(' ');
  const loggerProcess = spawnAsync(cmd, params);

  // Kill process when aborted
  signal.addEventListener(
    'abort',
    async () => {
      if (loggerProcess.child) {
        loggerProcess.child.kill('SIGTERM');
      }
      try {
        await loggerProcess;
      } catch {}
    },
    { once: true }
  );

  return async () => {
    try {
      const { output } = await loggerProcess;
      return output.flatMap((o) => o.split('\n'));
    } catch (error) {
      return error.output.flatMap((o) => o.split('\n'));
    }
  };
}
