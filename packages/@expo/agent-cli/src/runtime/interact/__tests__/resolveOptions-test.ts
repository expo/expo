// @ref llp/0018-interaction-commands.rfc.md
// @ref llp/0010-agent-conventions.rfc.md §Registry rules

import { CommandError } from '../../../utils/errors';
import {
  DEFAULT_MAX_NODES,
  resolveTapOptions,
  resolveTreeOptions,
  resolveTypeOptions,
} from '../resolveOptions';

describe(resolveTreeOptions, () => {
  it(`defaults to the focused screen, the interactive projection and a bounded node count`, () => {
    expect(resolveTreeOptions([])).toEqual({
      testID: null,
      full: false,
      allScreens: false,
      maxNodes: DEFAULT_MAX_NODES,
      devServerUrl: null,
      platform: undefined,
      json: false,
      bundleCheck: true,
      followups: true,
    });
  });

  it(`takes the whole tree and the full projection`, () => {
    expect(resolveTreeOptions(['--all', '--all-screens', '--json'])).toMatchObject({
      full: true,
      allScreens: true,
      json: true,
    });
  });

  it(`takes a testID in both spellings, because a flag an agent mistypes is a dead stop`, () => {
    expect(resolveTreeOptions(['--testID', 'add-note']).testID).toBe('add-note');
    expect(resolveTreeOptions(['--test-id', 'add-note']).testID).toBe('add-note');
  });

  it(`takes a node cap`, () => {
    expect(resolveTreeOptions(['--max-nodes', '25']).maxNodes).toBe(25);
  });

  it.each([['0'], ['-4'], ['many'], ['1.5']])(`refuses --max-nodes %p`, (value) => {
    expect(() => resolveTreeOptions(['--max-nodes', value])).toThrow(/--max-nodes/);
  });

  // @ref llp/0018 §Eight shipped decisions — friction run 7, F73. A value starting with `-` is a value the
  // argument parser reads as the next option, so the flag arrived with nothing after it and was
  // reported that way: "there was no next argument" about an argument that was right there.
  it.each([['-4'], ['-1']])(
    `says what --max-nodes %p was, rather than that it was missing`,
    (value) => {
      expect(() => resolveTreeOptions(['--max-nodes', value])).toThrow(
        new RegExp(`--max-nodes must be a whole number of 1 or more, but got ${value}`)
      );
    }
  );

  it(`still reports a --max-nodes with nothing after it as missing`, () => {
    expect(() => resolveTreeOptions(['--max-nodes'])).toThrow(/with nothing after it/);
  });

  // @ref llp/0018-interaction-commands.rfc.md §Must not lose — fiber depth on a real screen is 152, and every visible element
  // sits between 128 and 152, so a depth cap counts the wrong thing.
  it(`has no --depth, and says what to use instead`, () => {
    expect(() => resolveTreeOptions(['--depth', '5'])).toThrow(CommandError);
  });

  it(`refuses a bare word, which is a caller who meant --testID`, () => {
    expect(() => resolveTreeOptions(['add-note'])).toThrow(/--testID/);
  });

  it(`takes the dev server and the platform the way every runtime command does`, () => {
    expect(resolveTreeOptions(['--port', '8230', '--ios'])).toMatchObject({
      devServerUrl: 'http://127.0.0.1:8230',
      platform: 'ios',
    });
  });
});

describe(resolveTapOptions, () => {
  it(`reads the testID as its one positional argument`, () => {
    expect(resolveTapOptions(['add-note'])).toEqual({
      testID: 'add-note',
      index: null,
      allScreens: false,
      force: false,
      verify: false,
      maxNodes: DEFAULT_MAX_NODES,
      devServerUrl: null,
      platform: undefined,
      json: false,
      bundleCheck: true,
      followups: true,
    });
  });

  it(`takes an index, a scope, a force and a verify`, () => {
    expect(
      resolveTapOptions(['row', '--index', '2', '--all-screens', '--force', '--verify'])
    ).toMatchObject({ testID: 'row', index: 2, allScreens: true, force: true, verify: true });
  });

  it(`takes index 0, because the index it reports for the first match is 0`, () => {
    expect(resolveTapOptions(['row', '--index', '0']).index).toBe(0);
  });

  it.each([['-1'], ['two'], ['1.5']])(`refuses --index %p`, (value) => {
    expect(() => resolveTapOptions(['row', '--index', value])).toThrow(/--index/);
  });

  // @ref llp/0018 §Eight shipped decisions — friction run 7, F73.
  it(`says --index -1 is out of range, not that it was passed nothing`, () => {
    expect(() => resolveTapOptions(['row', '--index', '-1'])).toThrow(
      /--index must be a whole number of 0 or more, but got -1/
    );
    expect(() => resolveTypeOptions(['abc', '--testID', 'row', '--index', '-1'])).toThrow(
      /but got -1/
    );
  });

  it(`refuses a missing testID`, () => {
    expect(() => resolveTapOptions([])).toThrow(/testID/);
  });

  it(`refuses two testIDs rather than tapping the first`, () => {
    expect(() => resolveTapOptions(['a', 'b'])).toThrow(/one testID/);
  });
});

describe(resolveTypeOptions, () => {
  it(`reads the text as its positional and the testID as a flag`, () => {
    expect(resolveTypeOptions(['hello world', '--testID', 'note-input'])).toEqual({
      text: 'hello world',
      testID: 'note-input',
      index: null,
      allScreens: false,
      force: false,
      submit: false,
      maxNodes: DEFAULT_MAX_NODES,
      devServerUrl: null,
      platform: undefined,
      json: false,
      bundleCheck: true,
      followups: true,
    });
  });

  it(`takes --submit`, () => {
    expect(resolveTypeOptions(['hello', '--testID', 'note-input', '--submit']).submit).toBe(true);
  });

  it(`takes the empty string, which is how an input is cleared`, () => {
    expect(resolveTypeOptions(['', '--testID', 'note-input']).text).toBe('');
  });

  it(`refuses a run with no --testID, naming the flag`, () => {
    expect(() => resolveTypeOptions(['hello'])).toThrow(/--testID/);
  });

  // @ref llp/0018 §Eight shipped decisions — friction run 7, F77. Every other refusal of these commands says what,
  // why and how; this one was a bare usage line.
  it(`refuses a run with no text, with the same three parts as every other error`, () => {
    let caught: CommandError | null = null;
    try {
      resolveTypeOptions(['--testID', 'note-input']);
    } catch (error) {
      caught = error as CommandError;
    }

    expect(caught?.message).toMatch(/Missing text/);
    expect(caught?.message).toMatch(/Why:/);
    expect(caught?.message).toMatch(/How:/);
    // Clearing an input is a thing a caller means to do, so it is not the same as passing nothing.
    expect(caught?.message).toContain('""');
    expect(caught?.suggestedCommand).toBe('npx @expo/agent-cli runtime:tree');
  });

  it(`refuses two positionals, which is unquoted text`, () => {
    expect(() => resolveTypeOptions(['hello', 'world', '--testID', 'x'])).toThrow(/Quote/);
  });
});

// @ref llp/0018 §Shape of the code — friction run 7, F62. The gate `runtime:reload` already owns, and
// the same flag that declines it.
describe('the flags all three commands share', () => {
  it.each([
    ['runtime:tree', () => resolveTreeOptions(['--no-bundle-check'])],
    ['runtime:tap', () => resolveTapOptions(['row', '--no-bundle-check'])],
    ['runtime:type', () => resolveTypeOptions(['x', '--testID', 'row', '--no-bundle-check'])],
  ])(`%s takes --no-bundle-check`, (_command, resolve) => {
    expect(resolve()).toMatchObject({ bundleCheck: false });
  });

  it.each([
    ['runtime:tree', () => resolveTreeOptions(['--no-followups'])],
    ['runtime:tap', () => resolveTapOptions(['row', '--no-followups'])],
    ['runtime:type', () => resolveTypeOptions(['x', '--testID', 'row', '--no-followups'])],
  ])(`%s takes --no-followups`, (_command, resolve) => {
    expect(resolve()).toMatchObject({ followups: false });
  });
});
