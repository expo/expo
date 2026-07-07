import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { getFailedFlowsFromJUnitReport } from './maestro-junit-report';

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
}

export async function createMaestroFlowAsync({
  appId,
  e2eDir,
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

  for (const testCase of testCases) {
    contents.push(`\
- openLink: bareexpo://test-suite/run?tests=${testCase}
# make sure we're running the right test. Wait rather than assert instantly: after
# clearState the app cold-starts, and the selection header may not have rendered yet.
- extendedWaitUntil:
    visible:
      id: "test_suite_selection_query_text"
      text: "${testCase}"
    timeout: 30000
- extendedWaitUntil:
    visible:
      id: "test_suite_text_results"
    timeout: 120000
- assertVisible:
    id: "test_suite_summary_result_text"
    text: "All tests passed!"
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

export async function printImageComparisonServerLogs(): Promise<void> {
  const dir = path.join(process.env.HOME || '', '.maestro', 'tests');
  try {
    const entries = await fs.readdir(dir);
    const matches = entries.filter((name) => name.startsWith('screenshot-server-logs'));
    if (matches.length === 0) {
      return;
    }
    const stats = await Promise.all(
      matches.map(async (name) => ({ name, mtime: (await fs.stat(path.join(dir, name))).mtimeMs }))
    );
    stats.sort((a, b) => b.mtime - a.mtime);
    const latest = path.join(dir, stats[0].name);
    const contents = await fs.readFile(latest, 'utf8');
    console.log(`\n\n  📜 Image comparison server logs (${latest}):\n`);
    console.log(contents);
  } catch (e: any) {
    console.warn(`\n  ⚠️  Could not read image comparison server logs: ${e?.message ?? e}`);
  }
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

  const yamlFiles = await Array.fromAsync(fs.glob('**/*.yaml', { cwd: e2eDir, exclude: ignore }));
  yamlFiles.sort();

  console.log(`detected maestro files for ${platform}:`, yamlFiles);
  return yamlFiles;
};

export type RunMaestroFlowsFunction = (
  flowRelativePaths: string[],
  options: { attempt: number }
) => Promise<string[]>;

export const runCustomMaestroFlowsAsync = async (
  e2eDir: string,
  platform: 'android' | 'ios',
  runFlowsAsync: RunMaestroFlowsFunction
) => {
  const maxAttempts = 3;

  let flows = await getCustomMaestroFlowsAsync(e2eDir, platform);
  for (let attempt = 1; flows.length > 0; ++attempt) {
    console.log(`Custom e2e flows attempt ${attempt} of ${maxAttempts}: ${flows.join(', ')}`);
    const failedFlows = await runFlowsAsync(flows, { attempt });
    if (failedFlows.length === 0) {
      return;
    }
    if (attempt >= maxAttempts) {
      throw new Error(
        `Custom e2e flows kept failing after ${maxAttempts} attempts: ${failedFlows.join(', ')}`
      );
    }
    console.warn(`⚠️ Retrying failed flows: ${failedFlows.join(', ')}`);
    flows = failedFlows;
    await delayAsync(5000);
  }
};

export interface RunMaestroOptions {
  /** Global maestro CLI arguments selecting the device, e.g. `['--device', deviceId]`. */
  deviceArgs: string[];
  flowRelativePaths: string[];
  e2eDir: string;
  /**
   * Whether maestro should reinstall its on-device driver before running. Only the first
   * invocation in a session needs it; skipping the reinstall saves about a minute per invocation.
   */
  reinstallDriver: boolean;
  /** How long a wedged maestro may outlive its own JUnit report before it gets killed. */
  reportGracePeriodMs?: number;
  /** Hard ceiling on the whole invocation, for runs that never produce a report. */
  invocationTimeoutMs?: number;
}

/**
 * Runs the given flows in a single maestro invocation (flows execute in the given order and
 * a failed flow doesn't stop the following ones) and returns the relative paths of failed flows.
 * Throws if maestro fails without producing flow results, e.g. when it can't reach the device.
 *
 * Maestro writes the JUnit report only after all flows have finished, so a process that
 * outlives the report is just wedged on exit (Maestro 2.4.0 can crash its main thread while
 * finalizing logs and then hang forever on a non-daemon thread). A watchdog kills the process
 * once the report has been around for the grace period and the results are read as usual;
 * the invocation timeout backstops runs that never write a report at all.
 */
export async function runMaestroAsync({
  deviceArgs,
  flowRelativePaths,
  e2eDir,
  reinstallDriver,
  reportGracePeriodMs = 60_000,
  invocationTimeoutMs = 20 * 60_000,
}: RunMaestroOptions): Promise<string[]> {
  const reportPath = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), 'maestro-report-')),
    'report.xml'
  );
  const args = [
    ...deviceArgs,
    'test',
    ...(reinstallDriver ? [] : ['--no-reinstall-driver']),
    '--format',
    'junit',
    '--output',
    reportPath,
    ...flowRelativePaths.map((flowRelativePath) => path.join(e2eDir, flowRelativePath)),
  ];
  const maestroProcess = spawnAsync('maestro', args, {
    stdio: 'inherit',
    cwd: e2eDir,
    env: {
      ...process.env,
      ...MAESTRO_ENV_VARS,
    },
  });

  let killedReason: 'report-grace-period' | 'invocation-timeout' | null = null;
  const watchdogTimers: NodeJS.Timeout[] = [];
  const killMaestro = (reason: NonNullable<typeof killedReason>) => {
    killedReason = reason;
    maestroProcess.child?.kill('SIGTERM');
    watchdogTimers.push(
      setTimeout(() => {
        maestroProcess.child?.kill('SIGKILL');
      }, 10_000)
    );
  };
  const reportPollTimer = setInterval(async () => {
    if (await fileExistsAsync(reportPath)) {
      clearInterval(reportPollTimer);
      watchdogTimers.push(
        setTimeout(() => {
          return killMaestro('report-grace-period');
        }, reportGracePeriodMs)
      );
    }
  }, 1000);
  watchdogTimers.push(
    setTimeout(() => {
      return killMaestro('invocation-timeout');
    }, invocationTimeoutMs)
  );

  try {
    await maestroProcess;
    return [];
  } catch (error) {
    const reportContents = await fs.readFile(reportPath, 'utf8').catch(() => null);
    if (reportContents == null) {
      if (killedReason === 'invocation-timeout') {
        throw new Error(
          `maestro exceeded the invocation timeout of ${invocationTimeoutMs}ms and was killed ` +
            `before producing any flow results.`,
          { cause: error }
        );
      }
      throw error;
    }
    const failedFlows = getFailedFlowsFromJUnitReport(reportContents, flowRelativePaths);
    if (failedFlows.length === 0) {
      if (killedReason != null) {
        // maestro finished all flows and wrote a clean report, but wedged on exit; the kill
        // is ours, not a test failure.
        console.warn('⚠️ maestro did not exit after writing a clean report and was killed.');
        return [];
      }
      // maestro failed even though no flow was reported as failed, so something is wrong with
      // the run itself and retrying the flows wouldn't help.
      throw error;
    }
    return failedFlows;
  } finally {
    clearInterval(reportPollTimer);
    for (const timer of watchdogTimers) {
      clearTimeout(timer);
    }
    await fs.rm(path.dirname(reportPath), { recursive: true, force: true });
  }
}

export function startGroup(label: string) {
  if (process.env.CI) {
    console.log(`::group::${label}`);
  }
}

export function endGroup() {
  if (process.env.CI) {
    console.log('::endgroup::');
  }
}
