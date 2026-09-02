import fs from 'fs';
import path from 'path';

import { parseDevServerLogEntries, readDevServerLogErrors } from '../logErrors';

// The suite-wide `fs` mock is memfs, and this reads a log committed to this repository.
// `jest.unmock` is hoisted above the imports, so it belongs below them (`import/first`).
jest.unmock('fs');
jest.unmock('node:fs');

/**
 * A real detached dev server log, captured while an Android app threw
 * [observed — 2026-08-25, notesapp on SDK 57 in Expo Go on an Android emulator, port 8250].
 *
 * A file rather than a literal: the shape of these lines is another program's output, and a
 * hand-written approximation of it is exactly what a parser must not be tested against.
 */
const LIVE_LOG = fs
  .readFileSync(path.join(__dirname, 'fixtures/dev-detached-android-error.log'), 'utf8')
  .split('\n');

describe(parseDevServerLogEntries, () => {
  it('reads the thrown error out of a real log, with its code frame and stack', () => {
    const entries = parseDevServerLogEntries(LIVE_LOG);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      level: 'ERROR',
      message: '[Error: boom from HomeScreen]',
      // No platform prefix, and that is a property of the log rather than of the parser: Expo's
      // logger only prefixes when the app is not bridgeless, and every modern app is.
      platform: null,
      line: 11,
    });
    expect(entries[0]!.details).toContain('src/app/index.tsx:33:18');
    expect(entries[0]!.details).toContain("throw new Error('boom from HomeScreen')");
  });

  it('reads the platform prefix when the logger writes one', () => {
    const entries = parseDevServerLogEntries(['Android  ERROR  [Error: boom]', 'Call Stack']);

    expect(entries[0]).toMatchObject({ platform: 'Android', message: '[Error: boom]' });
  });

  it('ignores the levels that are not errors', () => {
    const entries = parseDevServerLogEntries([
      ' LOG  hello',
      ' WARN  careful',
      ' ERROR  boom',
      'iOS Bundled 409ms node_modules/expo-router/entry.js (1404 modules)',
    ]);

    expect(entries.map((entry) => entry.message)).toEqual(['boom']);
  });

  it('ends one entry where the next log line begins', () => {
    const entries = parseDevServerLogEntries([' ERROR  first', '  detail', ' ERROR  second']);

    expect(entries).toHaveLength(2);
    // The indentation is kept: a code frame's leading spaces are what line the caret up.
    expect(entries[0]!.details).toBe('  detail');
    expect(entries[1]!.message).toBe('second');
  });

  it('finds nothing in a log with no errors in it', () => {
    expect(parseDevServerLogEntries(['Starting Metro Bundler', 'Android Bundled 12ms'])).toEqual(
      []
    );
  });
});

describe(readDevServerLogErrors, () => {
  it('reports only the lines written after the mark', () => {
    const before = readDevServerLogErrors(LIVE_LOG, 0);
    expect(before.errors).toHaveLength(1);
    expect(before.older).toBe(0);

    // A window opened after the throw: the same error is there, and it is *older*, which is the
    // difference between "the app threw while I watched" and "the app threw at some point".
    const after = readDevServerLogErrors(LIVE_LOG, LIVE_LOG.length);
    expect(after.errors).toHaveLength(0);
    expect(after.older).toBe(1);
  });
});
