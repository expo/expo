// @ref llp/0014-interaction-spike.notes.md §Recommendation: GO, with these command shapes
// @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d)

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

  // @ref llp/0014 §Correction 1 — fiber depth on a real screen is 152, and every visible element
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
    });
  });

  it(`takes --submit`, () => {
    expect(
      resolveTypeOptions(['hello', '--testID', 'note-input', '--submit']).submit
    ).toBe(true);
  });

  it(`takes the empty string, which is how an input is cleared`, () => {
    expect(resolveTypeOptions(['', '--testID', 'note-input']).text).toBe('');
  });

  it(`refuses a run with no --testID, naming the flag`, () => {
    expect(() => resolveTypeOptions(['hello'])).toThrow(/--testID/);
  });

  it(`refuses a run with no text`, () => {
    expect(() => resolveTypeOptions(['--testID', 'note-input'])).toThrow(/text/);
  });

  it(`refuses two positionals, which is unquoted text`, () => {
    expect(() => resolveTypeOptions(['hello', 'world', '--testID', 'x'])).toThrow(/Quote/);
  });
});
