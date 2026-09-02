// @ref llp/0010-agent-conventions.rfc.md §Exit codes — the outcome band.
// What the command answers on each of its three channels, and which exit code each answer
// deserves. A code is not testable by reading it, so every one of the three gets its own case.
import * as Log from '../../log';
import type { TypeCheckReport } from '../types';
import { printTypeCheckAsync } from '../typecheckAsync';

jest.mock('../../log');
jest.mock('../../events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../checkAsync', () => ({ runTypeCheckAsync: jest.fn() }));

const { event } = require('../../events') as { event: jest.Mock };
const { runTypeCheckAsync } = require('../checkAsync') as { runTypeCheckAsync: jest.Mock };

const projectRoot = '/project';

function reports(overrides: Partial<TypeCheckReport> = {}): void {
  runTypeCheckAsync.mockResolvedValue({
    projectRoot,
    checked: true,
    reason: null,
    errorCount: 0,
    errors: [],
    durationMs: 1200,
    ...overrides,
  });
}

/** The one object the command printed on stdout. */
function payload(): any {
  const calls = jest.mocked(Log.log).mock.calls;
  expect(calls).toHaveLength(1);
  return JSON.parse(calls[0]![0]!);
}

/** Everything the command printed, joined into one string. */
function printed(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

const ERROR = {
  file: 'src/app/notes.tsx',
  line: 66,
  column: 22,
  code: 'TS2339',
  message: `Property 'md' does not exist on type '{ readonly two: 8; }'.`,
};

describe(printTypeCheckAsync, () => {
  it(`should exit 0 for a project that type-checks`, async () => {
    reports();

    await expect(printTypeCheckAsync(projectRoot, {})).resolves.toBe(0);
    expect(printed()).toContain('no type errors');
  });

  // The whole reason the command exists: a type error is an outcome failure, in the band an agent
  // can test with a range.
  it(`should exit 20 for a project that does not`, async () => {
    reports({ errorCount: 1, errors: [ERROR] });

    await expect(printTypeCheckAsync(projectRoot, {})).resolves.toBe(20);
    // `file:line:column`, the form an editor jumps to and the form every other location in this
    // CLI is printed in.
    expect(printed()).toContain('src/app/notes.tsx:66:22');
    expect(printed()).toContain('TS2339');
  });

  // A gate that went red for the absence of TypeScript would be red for every JavaScript project
  // forever, and a red that is not about the code is a red nobody can act on.
  it(`should exit 0 and say nothing was checked for a project without TypeScript`, async () => {
    reports({ checked: false, reason: 'this project has no tsconfig.json', durationMs: 0 });

    await expect(printTypeCheckAsync(projectRoot, {})).resolves.toBe(0);
    expect(printed()).toContain('not run');
    expect(printed()).toContain('no tsconfig.json');
  });

  it(`should print the nested explanation under the diagnostic it explains`, async () => {
    reports({
      errorCount: 1,
      errors: [{ ...ERROR, message: `Type 'A' is not assignable to type 'B'.\nwhy it is not` }],
    });

    await printTypeCheckAsync(projectRoot, {});

    expect(printed()).toContain(`Type 'A' is not assignable to type 'B'.`);
    expect(printed()).toContain('  why it is not');
  });

  describe('--json', () => {
    it(`should print one object with a stable set of top-level keys`, async () => {
      reports({ errorCount: 1, errors: [ERROR] });

      await expect(printTypeCheckAsync(projectRoot, { json: true })).resolves.toBe(20);
      expect(Object.keys(payload()).sort()).toEqual([
        'checked',
        'durationMs',
        'errorCount',
        'errors',
        'followups',
        'projectRoot',
        'reason',
      ]);
      expect(payload()).toMatchObject({
        projectRoot,
        checked: true,
        reason: null,
        errorCount: 1,
        errors: [ERROR],
        durationMs: 1200,
      });
    });

    it(`should keep the same key set when nothing was checked`, async () => {
      reports({ checked: false, reason: 'no tsconfig.json', durationMs: 0 });

      await printTypeCheckAsync(projectRoot, { json: true });

      expect(payload()).toMatchObject({ checked: false, reason: 'no tsconfig.json', errors: [] });
    });
  });

  describe('follow-ups', () => {
    it(`should ask for a rerun once the diagnostics are fixed`, async () => {
      reports({ errorCount: 1, errors: [ERROR] });

      await printTypeCheckAsync(projectRoot, { json: true });

      expect(payload().followups.map((followup: any) => followup.id)).toEqual([
        'typecheck-rerun',
      ]);
    });

    // Consistent types are one of the three gates, and this names the other two.
    it(`should name the gates a clean type check does not cover`, async () => {
      reports();

      await printTypeCheckAsync(projectRoot, { json: true });

      expect(payload().followups.map((followup: any) => followup.id)).toEqual([
        'typecheck-smoke',
        'typecheck-runtime-errors',
      ]);
    });

    it(`should say that a run which checked nothing proves nothing`, async () => {
      reports({ checked: false, reason: 'no tsconfig.json' });

      await printTypeCheckAsync(projectRoot, { json: true });

      expect(payload().followups.map((followup: any) => followup.id)).toEqual([
        'typecheck-not-run',
      ]);
    });

    it(`should leave them out with --no-followups`, async () => {
      reports({ errorCount: 1, errors: [ERROR] });

      await printTypeCheckAsync(projectRoot, { json: true, followups: false });

      expect(payload().followups).toEqual([]);
    });
  });

  // Counts only: a diagnostic quotes the project's own identifiers and types.
  it(`should put the counts on the event stream and nothing else`, async () => {
    reports({ errorCount: 2, errors: [ERROR, ERROR] });

    await printTypeCheckAsync(projectRoot, {});

    expect(event).toHaveBeenCalledWith('typecheck', {
      checked: true,
      errorCount: 2,
      durationMs: 1200,
    });
    expect(JSON.stringify(event.mock.calls)).not.toContain('notes.tsx');
  });
});
