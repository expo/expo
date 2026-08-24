import type { BundleCheckResult } from '../../runtime/bundleCheck';
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
    bundle: null,
    ...overrides,
  };
}

function bundle(overrides: Partial<BundleCheckResult> = {}): BundleCheckResult {
  return {
    outcome: 'ok',
    platform: 'ios',
    url: 'http://127.0.0.1:8081/index.bundle?platform=ios',
    error: null,
    waitedMs: 120,
    ...overrides,
  };
}

/** What a syntax error in a route looks like by the time it reaches this module. */
const BROKEN: Partial<BundleCheckResult> = {
  outcome: 'broken',
  error: {
    type: 'TransformError',
    filename: 'src/app/index.tsx',
    lineNumber: 101,
    column: 2,
    message: "SyntaxError: Unexpected keyword 'const'. (101:2)",
    snippet: '> 101 |   const x =',
  },
};

describe(devWaitSucceeded, () => {
  it.each([
    [{}, true],
    [{ ready: false }, false],
    // Without `--require-app` the apps are reported, not required.
    [{ appsConnected: 0 }, true],
    [{ requireApp: true, appsConnected: 0 }, false],
    [{ requireApp: true, appsConnected: 2 }, true],
    // Another project's dev server fails whatever else it answered: the wait is about *this*
    // project's bundle, and a ready one belonging to someone else is not it.
    [{ projectRootMatched: false, reportedProjectRoot: '/other' }, false],
    [{ projectRootMatched: false, requireApp: true, appsConnected: 3 }, false],
    // `null` is undecidable, not wrong — a dev server that named no project root still passes.
    [{ projectRootMatched: null, reportedProjectRoot: null }, true],
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
      bundle: {
        checked: false,
        ok: null,
        platform: null,
        url: null,
        error: null,
        reason: 'the entry bundle check was not run',
      },
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

    expect(lines).toHaveLength(5);
    expect(lines[0]).toContain('dev server');
    expect(lines[0]).toContain('via lock');
    expect(lines[1]).toContain('ready after 4.2s');
    expect(lines[2]).toContain('matches /project');
    expect(lines[3]).toContain('not checked');
    expect(lines[4]).toContain('1 app connected');
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

  // The one line of this report that is about the project rather than about the dev server.
  describe('the bundle line', () => {
    it(`should say the entry bundle compiles`, () => {
      const printed = formatDevWaitResult(result({ bundle: bundle() }));

      expect(printed).toContain('compiles for ios');
    });

    it(`should print the file, line, message and frame of a broken bundle`, () => {
      const printed = formatDevWaitResult(result({ bundle: bundle(BROKEN) }));

      expect(printed).toContain('does not compile for ios');
      expect(printed).toContain("SyntaxError: Unexpected keyword 'const'. (101:2)");
      expect(printed).toContain('src/app/index.tsx:101:2');
      expect(printed).toContain('> 101 |   const x =');
    });

    it(`should still name the file when the bundler gave no line`, () => {
      const printed = formatDevWaitResult(
        result({
          bundle: bundle({
            outcome: 'broken',
            error: {
              type: 'UnableToResolveError',
              filename: 'src/app/index.tsx',
              lineNumber: null,
              column: null,
              message: 'Unable to resolve module ./missing',
              snippet: null,
            },
          }),
        })
      );

      expect(printed).toContain('Unable to resolve module ./missing');
      expect(printed).toContain('src/app/index.tsx');
    });

    it(`should say the check was declined`, () => {
      expect(formatDevWaitResult(result({ bundle: null }))).toContain('not checked');
    });

    it(`should say the check could not decide, and why`, () => {
      const printed = formatDevWaitResult(
        result({ bundle: bundle({ outcome: 'unknown', url: null, reason: 'no launchAsset.url' }) })
      );

      expect(printed).toContain('unknown (no launchAsset.url)');
    });

    it(`should say a cold first build was still running`, () => {
      const printed = formatDevWaitResult(result({ bundle: bundle({ outcome: 'timeout' }) }));

      expect(printed).toContain('still building for ios (timed out)');
    });
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
