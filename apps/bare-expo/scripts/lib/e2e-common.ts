import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs/promises';
import * as path from 'path';
const MAESTRO_DRIVER_STARTUP_TIMEOUT = String(180_000);
const MAESTRO_CLI_NO_ANALYTICS = '1';

export const MAESTRO_ENV_VARS = {
  MAESTRO_DRIVER_STARTUP_TIMEOUT,
  MAESTRO_CLI_NO_ANALYTICS,
  MAESTRO_USE_GRAALJS: 'true',
};

export type StartMode = 'BUILD' | 'TEST' | 'BUILD_AND_TEST';

export const TEST_DURATION_LABEL = 'test duration';

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
  e2eDir: string;
  confirmFirstRunPromptIOS: boolean;
}

export async function createMaestroFlowAsync({
  appId,
  e2eDir,
  confirmFirstRunPromptIOS,
}: MaestroFlowParams): Promise<string> {
  const inputFile = await import('../../e2e/TestSuite-test.native.js');
  const testCases = inputFile.TESTS as string[];
  const MAESTRO_GENERATED_FLOW = 'maestro-generated.yaml';
  const workflowFile = path.join(e2eDir, MAESTRO_GENERATED_FLOW);

  const contents = [
    `\
appId: ${appId}
jsEngine: graaljs
---
- clearState
`,
  ];
  if (confirmFirstRunPromptIOS) {
    contents.push(`\
# Run once to approve the first time deeplinking prompt on iOS
- openLink: bareexpo://test-suite/run
- tapOn:
    text: "Open"
    optional: true
`);
  }

  for (const testCase of testCases) {
    contents.push(`\
- openLink: bareexpo://test-suite/run?tests=${testCase}
# make sure we're running the right test
- assertVisible:
    text: "${testCase}"
- extendedWaitUntil:
    visible:
      id: "test_suite_text_results"
    timeout: 120000
- assertVisible:
    text: "Success!"
`);
  }

  await fs.writeFile(workflowFile, contents.join('\n'));
  return workflowFile;
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

const getCustomMaestroFlowsAsync = async (
  e2eDir: string,
  platform?: 'android' | 'ios'
): Promise<string[]> => {
  const ignore = ['maestro-generated.yaml', '_nested-flows/**'];

  // Exclude platform-specific files for other platforms
  if (platform === 'android') {
    ignore.push('**/*.ios.yaml');
  } else if (platform === 'ios') {
    ignore.push('**/*.android.yaml');
  }

  const yamlFiles: string[] = [];
  for await (const file of fs.glob('**/*.yaml', { cwd: e2eDir, exclude: ignore })) {
    yamlFiles.push(file);
  }

  if (platform === 'ios') {
    yamlFiles.unshift('_nested-flows/confirm-app-open.yaml');
  }

  console.log(`detected maestro files for ${platform}:`, yamlFiles);
  return yamlFiles;
};

export const runCustomMaestroFlowsAsync = async (
  e2eDir: string,
  platform: 'android' | 'ios',
  fn: (maestroFlowFilePath: string) => Promise<void>
) => {
  const retriesForCustomTests = 3;

  const maestroFlows = await getCustomMaestroFlowsAsync(e2eDir, platform);
  for (const maestroFlowRelativePath of maestroFlows) {
    const maestroFlowFilePath = path.join(e2eDir, maestroFlowRelativePath);
    await retryAsync((retryNumber) => {
      console.log(
        `${maestroFlowRelativePath} e2e test attempt ${retryNumber + 1} of ${retriesForCustomTests}`
      );
      return fn(maestroFlowFilePath);
    }, retriesForCustomTests);
  }
};

export function startGroup(filePath: string) {
  if (process.env.CI) {
    const parts = filePath.split(path.sep).filter(Boolean);
    const lastTwoComponents = parts.slice(-2).join(path.sep);
    console.log(`::group::${lastTwoComponents}`);
  }
}

export function endGroup() {
  if (process.env.CI) {
    console.log('::endgroup::');
  }
}
