/* eslint-env jest */
// @ref llp/0012-build-explain.rfc.md §Reading a log this process did not write
// A log is another process's output, arriving over a stream this one does not control. Everything
// asserted here is a way that goes wrong: a chunk boundary in the middle of a line, a file with no
// trailing newline, CRLF from a Windows runner, a single line of several megabytes, ANSI, and a
// log longer than the window.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import {
  LINE_TRUNCATION_MARKER,
  MAX_LINE_LENGTH,
  MAX_LINES,
  readLogFileAsync,
  readLogStreamAsync,
} from '../readLog';

// The suite-wide `fs` mock is memfs, and these read logs committed to this repository.
// `jest.unmock` is hoisted above the imports, so it belongs below them (`import/first`).
jest.unmock('fs');
jest.unmock('node:fs');

/** A stream that hands over exactly these chunks, so a chunk boundary can be put anywhere. */
function streamOf(chunks: string[]): NodeJS.ReadableStream {
  return Readable.from(chunks);
}

let temporaryDir: string;
beforeAll(() => {
  temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'exagent-readlog-'));
});
afterAll(() => {
  fs.rmSync(temporaryDir, { recursive: true, force: true });
});

function writeTemporary(name: string, contents: string): string {
  const file = path.join(temporaryDir, name);
  fs.writeFileSync(file, contents);
  return file;
}

describe('readLogStreamAsync', () => {
  it('cuts lines out of chunks, not out of lines', async () => {
    // The newline arrives in a different chunk than the text before it, which is the ordinary
    // case for a piped subprocess and the one a naive `chunk.split` gets wrong.
    const read = await readLogStreamAsync(streamOf(['first', ' line\nsec', 'ond line\nthird']));
    expect(read.lines).toEqual(['first line', 'second line', 'third']);
  });

  // An EAS Build log is JSONL, one bunyan record per line — not the plain text every other log
  // this reads is [observed — 2026-08-26, staging build 77e676e2…, 644 records]. Left wrapped, the
  // rule table matches inside a JSON blob, the phase markers are invisible, and every context line
  // a reader is shown is 400 characters of metadata around the sentence they wanted.
  it('unwraps an EAS Build JSONL record to the message it carries', async () => {
    const record = JSON.stringify({
      name: 'worker',
      pid: 805,
      phase: 'INSTALL_PODS',
      buildId: '77e676e2',
      source: 'stdout',
      level: 30,
      msg: '[!] Oh no, an error occurred.',
      time: '2026-08-26T15:29:37.543Z',
    });

    const read = await readLogStreamAsync(streamOf([`${record}\n`]));
    expect(read.lines).toEqual(['[!] Oh no, an error occurred.']);
  });

  it('leaves alone any line that is not one of those records', async () => {
    // JSON that is not a log record is still log content — a printed app config, say, which the
    // same EAS log contains. Only an object carrying a string `msg` is a record.
    const read = await readLogStreamAsync(
      streamOf(['{"expo":{"name":"DailyWords"}}\n[1, 2, 3]\nnot json at all\n{"msg":42}\n'])
    );
    expect(read.lines).toEqual([
      '{"expo":{"name":"DailyWords"}}',
      '[1, 2, 3]',
      'not json at all',
      '{"msg":42}',
    ]);
  });

  it('keeps a last line that has no newline after it', async () => {
    // A stream cut off mid-write ends this way, and that partial line is often the interesting one.
    const read = await readLogStreamAsync(streamOf(['** BUILD FAILED **']));
    expect(read.lines).toEqual(['** BUILD FAILED **']);
  });

  it('drops the carriage return of a CRLF log', async () => {
    const read = await readLogStreamAsync(streamOf(['a\r\nb\r\n']));
    expect(read.lines).toEqual(['a', 'b']);
  });

  it('strips ANSI, so a rule never has to know about colour', async () => {
    const read = await readLogStreamAsync(streamOf(['[31merror: nope[39m\n']));
    expect(read.lines).toEqual(['error: nope']);
  });

  it('counts the bytes it read, not the bytes it kept', async () => {
    const read = await readLogStreamAsync(streamOf(['[31mabc[39m\n']));
    expect(read.bytes).toBe(Buffer.byteLength('[31mabc[39m\n', 'utf8'));
    expect(read.lines[0]).toBe('abc');
  });

  it('cuts a line that is longer than any rule reads, and says it did', async () => {
    const huge = 'x'.repeat(MAX_LINE_LENGTH * 3);
    const read = await readLogStreamAsync(streamOf([`${huge}\nshort\n`]));

    expect(read.lines[0]).toHaveLength(MAX_LINE_LENGTH + LINE_TRUNCATION_MARKER.length);
    expect(read.lines[0]!.endsWith(LINE_TRUNCATION_MARKER)).toBe(true);
    expect(read.lines[1]).toBe('short');
  });

  it('reports nothing dropped for a log that fits', async () => {
    const read = await readLogStreamAsync(streamOf(['a\nb\n']));
    expect(read).toMatchObject({ truncated: false, droppedLines: 0 });
  });

  it('keeps exactly the last MAX_LINES, and reports the rest as dropped', async () => {
    const total = MAX_LINES + 25_000;
    const chunks: string[] = [];
    for (let start = 0; start < total; start += 5_000) {
      chunks.push(
        Array.from({ length: 5_000 }, (_unused, index) => `line ${start + index}`).join('\n') + '\n'
      );
    }
    const read = await readLogStreamAsync(streamOf(chunks));

    expect(read.lines).toHaveLength(MAX_LINES);
    expect(read.droppedLines).toBe(25_000);
    expect(read.truncated).toBe(true);
    // The *tail* is what is kept: a build fails at its end.
    expect(read.lines[read.lines.length - 1]).toBe(`line ${total - 1}`);
    expect(read.lines[0]).toBe(`line ${total - MAX_LINES}`);
  });

  it('has nothing to report for an empty stream', async () => {
    const read = await readLogStreamAsync(streamOf([]));
    expect(read).toEqual({ lines: [], bytes: 0, truncated: false, droppedLines: 0 });
  });
});

describe('readLogFileAsync', () => {
  it('reads a file', async () => {
    const file = writeTemporary('build.log', '** BUILD FAILED **\n');
    await expect(readLogFileAsync(file)).resolves.toMatchObject({
      lines: ['** BUILD FAILED **'],
    });
  });

  it('says what to do when there is nothing at the path', async () => {
    await expect(readLogFileAsync(path.join(temporaryDir, 'nope.log'))).rejects.toMatchObject({
      code: 'LOG_UNREADABLE',
      message: expect.stringContaining('there is nothing at that path'),
    });
  });

  it('says so when the path is a directory rather than reading it as one', async () => {
    await expect(readLogFileAsync(temporaryDir)).rejects.toMatchObject({
      code: 'LOG_UNREADABLE',
      message: expect.stringContaining('that path is a directory'),
    });
  });

  it('ends every failure with something to run', async () => {
    await expect(readLogFileAsync(path.join(temporaryDir, 'nope.log'))).rejects.toMatchObject({
      suggestedCommand: 'npx exagent build:explain --help',
    });
  });
});
