import {
  devWaitResultToJson,
  devWaitSucceeded,
  formatDevWaitResult,
  formatDuration,
  type DevWaitResult,
} from '../waitFormat';

function result(overrides: Partial<DevWaitResult> = {}): DevWaitResult {
  return {
    devServerUrl: 'http://127.0.0.1:8081',
    source: 'lock',
    ready: true,
    projectRootMatched: true,
    reportedProjectRoot: '/project',
    projectRoot: '/project',
    appsConnected: 1,
    waitedMs: 4210,
    timedOut: false,
    requireApp: false,
    ...overrides,
  };
}

describe(devWaitSucceeded, () => {
  it.each([
    [{}, true],
    [{ ready: false }, false],
    // Without `--require-app` the apps are reported, not required.
    [{ appsConnected: 0 }, true],
    [{ requireApp: true, appsConnected: 0 }, false],
    [{ requireApp: true, appsConnected: 2 }, true],
  ])(`should decide %p`, (overrides, expected) => {
    expect(devWaitSucceeded(result(overrides))).toBe(expected);
  });
});

describe(devWaitResultToJson, () => {
  it(`should carry the whole answer under stable keys`, () => {
    expect(devWaitResultToJson(result(), [])).toEqual({
      ok: true,
      devServerUrl: 'http://127.0.0.1:8081',
      ready: true,
      projectRootMatched: true,
      projectRoot: '/project',
      appsConnected: 1,
      waitedMs: 4210,
      timedOut: false,
      source: 'lock',
      followups: [],
    });
  });

  it(`should keep the same key set for a wait that expired`, () => {
    const expired = devWaitResultToJson(
      result({ ready: false, timedOut: true, projectRootMatched: null, reason: 'still bundling' }),
      []
    );

    expect(Object.keys(expired).sort()).toEqual(
      Object.keys(devWaitResultToJson(result(), [])).sort()
    );
    expect(expired).toMatchObject({ ok: false, timedOut: true, projectRootMatched: null });
  });
});

describe(formatDevWaitResult, () => {
  it(`should print one labelled line per fact`, () => {
    const lines = formatDevWaitResult(result()).split('\n');

    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain('dev server');
    expect(lines[0]).toContain('via lock');
    expect(lines[1]).toContain('ready after 4.2s');
    expect(lines[2]).toContain('matches /project');
    expect(lines[3]).toContain('1 app connected');
  });

  it(`should name a wait that expired as still working, not as failed`, () => {
    const printed = formatDevWaitResult(result({ ready: false, timedOut: true, waitedMs: 300 }));

    expect(printed).toContain('still working after 300ms (timed out)');
  });

  it(`should quote the reason a dev server was not ready`, () => {
    const printed = formatDevWaitResult(
      result({ ready: false, timedOut: false, reason: 'not an Expo dev server' })
    );

    expect(printed).toContain('not ready');
    expect(printed).toContain('not an Expo dev server');
  });

  it(`should name the other project a mismatched dev server serves`, () => {
    const printed = formatDevWaitResult(
      result({ projectRootMatched: false, reportedProjectRoot: '/other-project' })
    );

    expect(printed).toContain('serves /other-project, not /project');
  });

  it(`should say when a required app never attached`, () => {
    const printed = formatDevWaitResult(result({ requireApp: true, appsConnected: 0 }));

    expect(printed).toContain('0 apps connected (timed out waiting for one)');
  });
});

describe(formatDuration, () => {
  it.each([
    [0, '0ms'],
    [999, '999ms'],
    [1000, '1.0s'],
    [4210, '4.2s'],
  ])(`should print %pms as %p`, (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});
