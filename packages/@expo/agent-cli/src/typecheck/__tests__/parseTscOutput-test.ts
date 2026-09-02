// The parse pinned against **recorded** compiler output in both of its forms, per
// `./fixtures/README.md`. A hand-written sample would pin what this file believes `tsc` prints;
// these two pin what it printed.
import fs from 'fs';
import path from 'path';

import { parseTscOutput } from '../parseTscOutput';

// The suite reads real bytes off disk, so it opts out of the in-memory `fs` the setup file installs
// for every other suite. These recordings are the input under test; a fake one would prove nothing.
jest.unmock('fs');

/** Read one recording out of `./fixtures`. */
function fixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
}

const TERSE = fixture('tsc-terse.txt');
const PRETTY = fixture('tsc-pretty.txt');

describe(parseTscOutput, () => {
  it(`should read the terse form the gate asks for`, () => {
    const errors = parseTscOutput(TERSE);

    expect(errors).toHaveLength(2);
    expect(errors[1]).toEqual({
      file: 'src/app/notes.tsx',
      line: 71,
      column: 22,
      code: 'TS2339',
      message: expect.stringContaining(`Property 'md' does not exist`),
    });
  });

  // The two forms are one run of one project, so they have to parse to the same answer.
  it(`should read the pretty form to the same answer`, () => {
    const terse = parseTscOutput(TERSE);
    const pretty = parseTscOutput(PRETTY);

    expect(pretty).toEqual(terse);
  });

  it(`should join a nested explanation onto the message it explains`, () => {
    const [first] = parseTscOutput(TERSE);

    expect(first!.code).toBe('TS2322');
    expect(first!.message.split('\n')).toEqual([
      `Type '(value: number) => void' is not assignable to type '(value: string) => void'.`,
      `Types of parameters 'value' and 'value' are incompatible.`,
      `Type 'string' is not assignable to type 'number'.`,
    ]);
  });

  // The code frame the pretty form draws is indented exactly like a continuation line, and the
  // blank line above it is the only thing that tells them apart.
  it(`should not read a pretty code frame as part of the message`, () => {
    for (const error of parseTscOutput(PRETTY)) {
      expect(error.message).not.toContain('~~');
      expect(error.message).not.toContain('padding: Spacing.md');
    }
  });

  it(`should not read the closing summary as a diagnostic`, () => {
    for (const output of [TERSE, PRETTY]) {
      expect(parseTscOutput(output).map((error) => error.code)).toEqual(['TS2322', 'TS2339']);
    }
  });

  it(`should strip the colors of a pretty run`, () => {
    for (const error of parseTscOutput(PRETTY)) {
      expect(error.file).toBe('src/app/notes.tsx');
      expect(JSON.stringify(error)).not.toContain('\u001b');
    }
  });

  it(`should report nothing for a clean run`, () => {
    expect(parseTscOutput('')).toEqual([]);
    expect(parseTscOutput('\n\n')).toEqual([]);
  });

  // A diagnostic about the configuration has no file, and dropping it would leave a failing run
  // reporting zero errors — which is exactly the answer a gate must never give.
  it(`should keep a diagnostic that names no file`, () => {
    const errors = parseTscOutput(
      `error TS18003: No inputs were found in config file '/project/tsconfig.json'. Specified 'include' paths were '["src"]'.`
    );

    expect(errors).toEqual([
      {
        file: null,
        line: null,
        column: null,
        code: 'TS18003',
        message: expect.stringContaining('No inputs were found'),
      },
    ]);
  });

  it(`should read a Windows path with a drive letter in it`, () => {
    const errors = parseTscOutput(
      `C:\\project\\src\\app.ts(3,9): error TS2304: Cannot find name 'nope'.`
    );

    expect(errors).toEqual([
      {
        file: 'C:\\project\\src\\app.ts',
        line: 3,
        column: 9,
        code: 'TS2304',
        message: `Cannot find name 'nope'.`,
      },
    ]);
  });

  it(`should read a warning the way it reads an error`, () => {
    expect(parseTscOutput(`src/a.ts(1,1): warning TS0000: something`)).toHaveLength(1);
  });
});
