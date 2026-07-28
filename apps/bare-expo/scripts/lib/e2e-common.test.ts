import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from 'bun:test';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { annotate, runMaestroAsync } from './e2e-common';

// A stand-in `maestro` binary that mimics Maestro's failure modes: it optionally writes the
// JUnit report passed via --output and then hangs forever, like Maestro 2.4.0 wedging on exit
// after its flows have finished.
const FAKE_MAESTRO = `#!/bin/bash
report=""
previous=""
for arg in "$@"; do
  if [ "$previous" = "--output" ]; then
    report="$arg"
  fi
  previous="$arg"
done
if [ -n "$FAKE_MAESTRO_REPORT" ] && [ -n "$report" ]; then
  printf '%s' "$FAKE_MAESTRO_REPORT" > "$report"
fi
if [ "$FAKE_MAESTRO_WEDGE" = "1" ]; then
  # exec so that the watchdog's signal hits the sleeping process directly instead of
  # orphaning it behind the killed shell
  exec sleep 1000
fi
exit "\${FAKE_MAESTRO_EXIT_CODE:-1}"
`;

function makeReport(testcases: string): string {
  return `<?xml version='1.0' encoding='UTF-8'?>
<testsuites>
  <testsuite name="Test Suite" tests="2" failures="1" time="2.0">
${testcases}
  </testsuite>
</testsuites>`;
}

const CLEAN_REPORT = makeReport(`
    <testcase id="test" name="test" classname="test" time="1.0" status="SUCCESS"/>
    <testcase id="playback-test" name="playback-test" classname="playback-test" time="1.0" status="SUCCESS"/>
`);

const FAILING_REPORT = makeReport(`
    <testcase id="test" name="test" classname="test" time="1.0" status="SUCCESS"/>
    <testcase id="playback-test" name="playback-test" classname="playback-test" time="1.0" status="ERROR">
      <failure>Element not found</failure>
    </testcase>
`);

const FLOWS = ['expo-image/test.yaml', 'expo-video/playback-test.yaml'];

describe(runMaestroAsync, () => {
  let fixtureDir: string;
  let originalPath: string | undefined;

  beforeAll(async () => {
    fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fake-maestro-'));
    const fakeMaestroPath = path.join(fixtureDir, 'maestro');
    await fs.writeFile(fakeMaestroPath, FAKE_MAESTRO, { mode: 0o755 });
    originalPath = process.env.PATH;
    process.env.PATH = `${fixtureDir}:${originalPath}`;
  });

  afterAll(async () => {
    process.env.PATH = originalPath;
    await fs.rm(fixtureDir, { recursive: true, force: true });
  });

  it('returns failed flows when maestro exits non-zero with a report', async () => {
    process.env.FAKE_MAESTRO_REPORT = FAILING_REPORT;
    process.env.FAKE_MAESTRO_WEDGE = '0';
    const failedFlows = await runMaestroAsync({
      deviceArgs: [],
      flowRelativePaths: FLOWS,
      e2eDir: fixtureDir,
      reinstallDriver: true,
    });
    expect(failedFlows).toEqual(['expo-video/playback-test.yaml']);
  });

  it('kills a wedged maestro after a clean report and treats the run as passed', async () => {
    process.env.FAKE_MAESTRO_REPORT = CLEAN_REPORT;
    process.env.FAKE_MAESTRO_WEDGE = '1';
    const failedFlows = await runMaestroAsync({
      deviceArgs: [],
      flowRelativePaths: FLOWS,
      e2eDir: fixtureDir,
      reinstallDriver: true,
      reportGracePeriodMs: 300,
    });
    expect(failedFlows).toEqual([]);
  }, 15000);

  it('kills a wedged maestro after a failing report and returns the failed flows', async () => {
    process.env.FAKE_MAESTRO_REPORT = FAILING_REPORT;
    process.env.FAKE_MAESTRO_WEDGE = '1';
    const failedFlows = await runMaestroAsync({
      deviceArgs: [],
      flowRelativePaths: FLOWS,
      e2eDir: fixtureDir,
      reinstallDriver: true,
      reportGracePeriodMs: 300,
    });
    expect(failedFlows).toEqual(['expo-video/playback-test.yaml']);
  }, 15000);

  it('throws when maestro hangs without ever writing a report', async () => {
    delete process.env.FAKE_MAESTRO_REPORT;
    process.env.FAKE_MAESTRO_WEDGE = '1';
    await expect(
      runMaestroAsync({
        deviceArgs: [],
        flowRelativePaths: FLOWS,
        e2eDir: fixtureDir,
        reinstallDriver: true,
        invocationTimeoutMs: 1500,
      })
    ).rejects.toThrow('was killed');
  }, 15000);

  it('throws when maestro fails without a report', async () => {
    delete process.env.FAKE_MAESTRO_REPORT;
    process.env.FAKE_MAESTRO_WEDGE = '0';
    await expect(
      runMaestroAsync({
        deviceArgs: [],
        flowRelativePaths: FLOWS,
        e2eDir: fixtureDir,
        reinstallDriver: true,
      })
    ).rejects.toThrow();
  });
});

describe(annotate, () => {
  const originalActions = process.env.GITHUB_ACTIONS;
  const originalWorkspace = process.env.GITHUB_WORKSPACE;

  afterEach(() => {
    process.env.GITHUB_ACTIONS = originalActions;
    process.env.GITHUB_WORKSPACE = originalWorkspace;
    jest.restoreAllMocks();
  });

  it('emits a workflow command with a repo-relative file path', () => {
    process.env.GITHUB_ACTIONS = 'true';
    process.env.GITHUB_WORKSPACE = '/repo';
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    annotate(
      'error',
      'e2e flow failed',
      'playback-test kept failing',
      '/repo/apps/bare-expo/e2e/expo-video/playback-test.yaml'
    );
    expect(log).toHaveBeenCalledWith(
      '::error title=e2e flow failed,file=apps/bare-expo/e2e/expo-video/playback-test.yaml::playback-test kept failing'
    );
  });

  it('omits the file property without a workspace', () => {
    process.env.GITHUB_ACTIONS = 'true';
    delete process.env.GITHUB_WORKSPACE;
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    annotate('warning', 'Flaky e2e flow', 'test failed on attempt 1', '/somewhere/test.yaml');
    expect(log).toHaveBeenCalledWith('::warning title=Flaky e2e flow::test failed on attempt 1');
  });

  it('does nothing outside of GitHub Actions', () => {
    delete process.env.GITHUB_ACTIONS;
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    annotate('error', 'title', 'message');
    expect(log).not.toHaveBeenCalled();
  });
});
