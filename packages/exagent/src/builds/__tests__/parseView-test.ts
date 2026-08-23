import { parseLastJsonObject, readBuildDetails, readProgress } from '../parseView';

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
