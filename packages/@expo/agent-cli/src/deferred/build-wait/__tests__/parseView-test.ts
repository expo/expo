// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import recordedInProgress from '../../../__fixtures__/eas/build-view-in-progress.staging.json';
import recordedInQueue from '../../../__fixtures__/eas/build-view-in-queue.staging.json';
import recordedView from '../../../__fixtures__/eas/build-view.json';
import { parseLastJsonObject, readBuildDetails, readProgress } from '../parseView';
import { resolveTerminalStatus } from '../status';

describe(parseLastJsonObject, () => {
  it(`reads the object a clean --json run prints`, () => {
    expect(parseLastJsonObject('{"id":"abc","status":"FINISHED"}\n')).toEqual({
      id: 'abc',
      status: 'FINISHED',
    });
  });

  it(`reads a pretty-printed object`, () => {
    const output = ['{', '  "id": "abc",', '  "status": "IN_QUEUE"', '}', ''].join('\n');

    expect(parseLastJsonObject(output)).toEqual({ id: 'abc', status: 'IN_QUEUE' });
  });

  // An update notice on the wrong stream is the failure this parser exists for.
  it(`ignores anything printed above the answer`, () => {
    const noisy = [
      'Warning: this version of eas-cli is out of date',
      '',
      '{"id":"abc","status":"IN_PROGRESS"}',
    ].join('\n');

    expect(parseLastJsonObject(noisy)).toEqual({ id: 'abc', status: 'IN_PROGRESS' });
  });

  it(`ignores anything printed above a pretty-printed answer`, () => {
    const noisy = ['Some notice', '{', '  "status": "FINISHED"', '}'].join('\n');

    expect(parseLastJsonObject(noisy)).toEqual({ status: 'FINISHED' });
  });

  it(`takes the last object when more than one was printed`, () => {
    const output = '{"status":"IN_QUEUE"}\n{"status":"FINISHED"}\n';

    expect(parseLastJsonObject(output)).toEqual({ status: 'FINISHED' });
  });

  it(`answers nothing for output that holds no object`, () => {
    expect(parseLastJsonObject('')).toBeNull();
    expect(parseLastJsonObject('   \n  ')).toBeNull();
    expect(parseLastJsonObject('Build not found\n')).toBeNull();
    expect(parseLastJsonObject('{"status":')).toBeNull();
  });

  // A wait that accepted an array would then read `status` off it and poll forever.
  it(`answers nothing for JSON that is not an object`, () => {
    expect(parseLastJsonObject('[{"status":"FINISHED"}]')).toBeNull();
    expect(parseLastJsonObject('"FINISHED"')).toBeNull();
    expect(parseLastJsonObject('null')).toBeNull();
  });
});

describe(`the recorded build:view payload`, () => {
  // A real finished build, read by the real parser — see `src/__fixtures__/eas/README.md`. What it
  // pins is the fields that *do* arrive, and the shape of the ones that do not: `error`,
  // `queuePosition` and `estimatedWaitTimeLeftSeconds` are simply absent on a finished build, and
  // `artifacts.buildArtifactsUrl` is absent on this one, so every reader has to answer `null`
  // rather than throw. That is the whole reason nothing in this parser is required.
  it(`reads the details of a finished build`, () => {
    const details = readBuildDetails(recordedView);

    expect(details.metrics).toEqual({
      buildWaitTime: 4688,
      buildQueueTime: 26451,
      buildDuration: 692681,
    });
    expect(details.fingerprint).toEqual({ hash: '780787df6bf4487623fb422f7e020974dc98c4a9' });
    expect(details.artifacts).toMatchObject({ buildArtifactsUrl: null });
    expect(details.artifacts?.applicationArchiveUrl).toBe(recordedView.artifacts.buildUrl);
    expect(details.completedAt).toBe('2026-08-19T17:49:16.494Z');
    expect(details.appVersion).toBe('1.0.0');
    expect(details.appBuildVersion).toBe('43');
    // Absent, not empty: a finished build has no error object at all.
    expect(details.error).toBeNull();
  });

  it(`reads the progress of a build that is no longer queued`, () => {
    expect(readProgress(recordedView, 1000)).toEqual({
      status: 'FINISHED',
      queuePosition: null,
      estimatedWaitTimeLeftSeconds: null,
      elapsedMs: 1000,
    });
  });
});

// The two statuses a wait actually spends its time in, recorded live on staging rather than
// guessed — see `src/__fixtures__/eas/README.md` §The non-terminal statuses.
describe(`the recorded non-terminal payloads`, () => {
  it(`pins the spelling of the two statuses a wait polls through`, () => {
    expect(recordedInQueue.status).toBe('IN_QUEUE');
    expect(recordedInProgress.status).toBe('IN_PROGRESS');
    // Neither may end a wait. Getting this wrong reports an outcome nobody observed.
    expect(resolveTerminalStatus(recordedInQueue.status)).toBeNull();
    expect(resolveTerminalStatus(recordedInProgress.status)).toBeNull();
  });

  // The field a reader most wants while waiting is the field that is never there. It is requested
  // on every query and dropped from the payload whenever the service leaves it null, so `null` is
  // the answer the parser must produce — not a throw, and not a missing key it trips over.
  it(`answers null for the queue fields that never arrive`, () => {
    expect(readProgress(recordedInQueue, 500)).toEqual({
      status: 'IN_QUEUE',
      queuePosition: null,
      estimatedWaitTimeLeftSeconds: null,
      elapsedMs: 500,
    });
    expect(readProgress(recordedInProgress, 500)).toEqual({
      status: 'IN_PROGRESS',
      queuePosition: null,
      estimatedWaitTimeLeftSeconds: null,
      elapsedMs: 500,
    });
  });

  // No `eas --json` payload contains a literal null: the CLI's sanitizer deletes those keys before
  // printing. A fixture that had one would mean the recording was edited.
  it(`carries no null anywhere, because the EAS CLI strips them`, () => {
    for (const payload of [recordedInQueue, recordedInProgress]) {
      expect(JSON.stringify(payload)).not.toContain('null');
    }
  });

  it(`has a fetchable log while the build is still running`, () => {
    // Empty before the build starts, populated once it does — so `build:explain` has something to
    // read from a build that has not finished and may never finish.
    expect(recordedInQueue.logFiles).toEqual([]);
    expect(recordedInProgress.logFiles.length).toBeGreaterThan(0);
    // Neither has produced an artifact yet.
    expect(recordedInQueue.artifacts).toEqual({});
    expect(recordedInProgress.artifacts).toEqual({});
  });
});

describe(readBuildDetails, () => {
  it(`reads the fields of a finished build`, () => {
    const payload = {
      status: 'FINISHED',
      createdAt: '2026-08-23T10:00:00.000Z',
      completedAt: '2026-08-23T10:12:00.000Z',
      appVersion: '1.2.0',
      appBuildVersion: '42',
      artifacts: {
        buildUrl: 'https://expo.dev/artifacts/eas/abc.ipa',
        applicationArchiveUrl: 'https://expo.dev/artifacts/eas/abc.ipa',
        buildArtifactsUrl: null,
        xcodeBuildLogsUrl: 'https://expo.dev/artifacts/eas/logs.txt',
      },
      fingerprint: { id: 'f1', hash: 'a1b2c3' },
      metrics: { buildWaitTime: 32, buildQueueTime: 118, buildDuration: 604 },
    };

    expect(readBuildDetails(payload)).toEqual({
      error: null,
      artifacts: {
        buildUrl: 'https://expo.dev/artifacts/eas/abc.ipa',
        applicationArchiveUrl: 'https://expo.dev/artifacts/eas/abc.ipa',
        buildArtifactsUrl: null,
        xcodeBuildLogsUrl: 'https://expo.dev/artifacts/eas/logs.txt',
      },
      fingerprint: { hash: 'a1b2c3' },
      metrics: { buildWaitTime: 32, buildQueueTime: 118, buildDuration: 604 },
      createdAt: '2026-08-23T10:00:00.000Z',
      completedAt: '2026-08-23T10:12:00.000Z',
      appVersion: '1.2.0',
      appBuildVersion: '42',
    });
  });

  it(`reads why a build failed`, () => {
    const details = readBuildDetails({
      status: 'ERRORED',
      error: {
        errorCode: 'EAS_BUILD_UNKNOWN_FAIL',
        message: 'build failed',
        docsUrl: 'https://docs.expo.dev/build-reference/troubleshooting/',
      },
    });

    expect(details.error).toEqual({
      errorCode: 'EAS_BUILD_UNKNOWN_FAIL',
      message: 'build failed',
      docsUrl: 'https://docs.expo.dev/build-reference/troubleshooting/',
    });
  });

  // "No artifacts" and "artifacts of nulls" are different answers, and only the payload knows.
  it(`keeps a section that is absent absent, and one that is present shaped`, () => {
    const details = readBuildDetails({ artifacts: {} });

    expect(details.error).toBeNull();
    expect(details.metrics).toBeNull();
    expect(details.artifacts).toEqual({
      buildUrl: null,
      applicationArchiveUrl: null,
      buildArtifactsUrl: null,
      xcodeBuildLogsUrl: null,
    });
  });

  // The payload is another CLI's, read across a process boundary: nothing here may throw.
  it(`degrades to nulls instead of throwing on a payload of the wrong shape`, () => {
    for (const payload of [
      null,
      {},
      { error: 'boom', artifacts: [], metrics: 3, fingerprint: 'a1b2' },
      { appVersion: 12, createdAt: false },
    ]) {
      expect(() => readBuildDetails(payload as any)).not.toThrow();
    }

    expect(readBuildDetails({ error: 'boom', artifacts: [] } as any)).toMatchObject({
      error: null,
      artifacts: null,
    });
    expect(readBuildDetails({ appVersion: 12 } as any).appVersion).toBeNull();
  });
});

describe(readProgress, () => {
  it(`reads the queue fields that make a wait readable while it runs`, () => {
    const progress = readProgress(
      { status: 'IN_QUEUE', queuePosition: 11, estimatedWaitTimeLeftSeconds: 240 },
      4200
    );

    expect(progress).toEqual({
      status: 'IN_QUEUE',
      queuePosition: 11,
      estimatedWaitTimeLeftSeconds: 240,
      elapsedMs: 4200,
    });
  });

  it(`reports nothing rather than guessing when the queue fields are gone`, () => {
    expect(readProgress({ status: 'IN_PROGRESS' }, 0)).toEqual({
      status: 'IN_PROGRESS',
      queuePosition: null,
      estimatedWaitTimeLeftSeconds: null,
      elapsedMs: 0,
    });
    expect(readProgress(null, 5)).toEqual({
      status: null,
      queuePosition: null,
      estimatedWaitTimeLeftSeconds: null,
      elapsedMs: 5,
    });
  });
});
