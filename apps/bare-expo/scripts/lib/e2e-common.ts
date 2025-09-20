import * as fs from 'fs/promises';
import { glob } from 'glob';
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
---
- clearState
`,
  ];

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

const getCustomMaestroFlowsAsync = async (e2eDir: string): Promise<string[]> => {
  const yamlFiles = await glob.glob('**/*.yaml', {
    cwd: e2eDir,
    maxDepth: 2, // e2e root + one level deep
    ignore: ['maestro-generated.yaml', '_nested-flows/**'],
  });

  console.log({ 'detected maestro files:': yamlFiles });
  return yamlFiles;
};

export const runCustomMaestroFlowsAsync = async (
  e2eDir: string,
  fn: (maestroFlowFilePath: string) => Promise<void>
) => {
  const retriesForCustomTests = 3;

  const maestroFlows = await getCustomMaestroFlowsAsync(e2eDir);
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
