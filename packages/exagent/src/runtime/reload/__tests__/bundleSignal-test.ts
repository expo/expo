import { vol } from 'memfs';

import { detachedLogPath } from '../../../dev/logFile';
import {
  markBundleSignalSync,
  readBundleLines,
  waitForNewBundleAsync,
} from '../bundleSignal';

const projectRoot = '/project';

function writeLog(lines: string[]): void {
  vol.fromJSON({ [detachedLogPath(projectRoot)]: lines.join('\n') + '\n' });
}

function appendLog(lines: string[]): void {
  const path = detachedLogPath(projectRoot);
  const before = require('fs').readFileSync(path, 'utf8') as string;
  require('fs').writeFileSync(path, before + lines.join('\n') + '\n');
}

afterEach(() => {
  vol.reset();
});

describe(readBundleLines, () => {
  // The line Metro's Expo reporter prints when a bundle build finishes [observed —
  // `packages/@expo/cli/src/start/server/metro/MetroTerminalReporter.ts`, `iOS Bundled 150ms`].
  it(`reads the platform, the entry and the module count off a finished bundle`, () => {
    expect(
      readBundleLines([
        'Starting project at /project',
        'iOS Bundled 1387ms node_modules/expo-router/entry.js (943 modules)',
      ])
    ).toEqual([
      {
        platform: 'iOS',
        entry: 'node_modules/expo-router/entry.js',
        modules: 943,
        text: 'iOS Bundled 1387ms node_modules/expo-router/entry.js (943 modules)',
      },
    ]);
  });

  // A warm rebuild is reported in microseconds, and a single-module bundle drops the plural.
  it(`reads a warm rebuild and a one-module bundle`, () => {
    const read = readBundleLines(['Android Bundled 0.4ms index.js (1 module)']);
    expect(read).toHaveLength(1);
    expect(read[0]).toMatchObject({ platform: 'Android', modules: 1 });
  });

  it(`is not fooled by a failed build or by the word in prose`, () => {
    expect(
      readBundleLines([
        'iOS Bundling failed 213ms node_modules/expo-router/entry.js (5 modules)',
        'Something about a Bundled thing',
      ])
    ).toEqual([]);
  });
});

describe(markBundleSignalSync, () => {
  it(`says the signal is unavailable when the project has no captured log`, () => {
    expect(markBundleSignalSync(projectRoot)).toMatchObject({
      available: false,
      bundles: 0,
      reason: expect.stringContaining('no detached dev server log'),
    });
  });

  it(`counts what the log already holds`, () => {
    writeLog([
      'Starting project at /project',
      'iOS Bundled 1387ms node_modules/expo-router/entry.js (943 modules)',
    ]);
    expect(markBundleSignalSync(projectRoot)).toMatchObject({
      available: true,
      bundles: 1,
      totalLines: 2,
      reason: null,
    });
  });
});

describe(waitForNewBundleAsync, () => {
  it(`observes a bundle the dev server built after the mark`, async () => {
    writeLog(['Starting project at /project']);
    const before = markBundleSignalSync(projectRoot);
    setTimeout(
      () => appendLog(['iOS Bundled 88ms node_modules/expo-router/entry.js (943 modules)']),
      60
    );

    await expect(
      waitForNewBundleAsync(projectRoot, { before, timeoutMs: 3000, intervalMs: 25 })
    ).resolves.toMatchObject({
      observed: true,
      newBundles: 1,
      last: { platform: 'iOS', modules: 943 },
    });
  });

  // The whole point of counting from the mark: a bundle the dev server served *before* the reload
  // is not evidence that the app fetched one after it.
  it(`does not count a bundle that was already in the log`, async () => {
    writeLog(['iOS Bundled 1387ms node_modules/expo-router/entry.js (943 modules)']);
    const before = markBundleSignalSync(projectRoot);

    await expect(
      waitForNewBundleAsync(projectRoot, { before, timeoutMs: 120, intervalMs: 25 })
    ).resolves.toMatchObject({ observed: false, newBundles: 0 });
  });

  it(`reports the wait as unusable when there is no log to watch`, async () => {
    const before = markBundleSignalSync(projectRoot);

    await expect(
      waitForNewBundleAsync(projectRoot, { before, timeoutMs: 120, intervalMs: 25 })
    ).resolves.toMatchObject({
      observed: false,
      reason: expect.stringContaining('no detached dev server log'),
    });
  });

  // A dev server restarted mid-run truncates the log, so the mark's line count is ahead of the
  // file's. Reading "everything after line 40" out of a 3-line file would count a fresh first
  // bundle as evidence for a reload this command never caused.
  it(`refuses to read a log that was truncated after the mark`, async () => {
    writeLog([
      'iOS Bundled 1387ms node_modules/expo-router/entry.js (943 modules)',
      'iOS Bundled 12ms node_modules/expo-router/entry.js (943 modules)',
      'three',
      'four',
    ]);
    const before = markBundleSignalSync(projectRoot);
    writeLog(['iOS Bundled 90ms node_modules/expo-router/entry.js (943 modules)']);

    await expect(
      waitForNewBundleAsync(projectRoot, { before, timeoutMs: 120, intervalMs: 25 })
    ).resolves.toMatchObject({
      observed: false,
      reason: expect.stringContaining('truncated'),
    });
  });
});
