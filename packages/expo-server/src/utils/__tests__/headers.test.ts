import { appendHeadersRecord, mergeHeaderInputs } from '../headers';

describe(appendHeadersRecord, () => {
  it('sets scalars only when absent without `shouldOverwrite`', () => {
    const headers = new Headers({ 'X-A': 'existing' });

    appendHeadersRecord(headers, { 'X-A': 'update', 'X-B': 'new' }, false);

    expect(headers.get('X-A')).toBe('existing');
    expect(headers.get('X-B')).toBe('new');
  });

  it('replaces scalars with `shouldOverwrite`', () => {
    const headers = new Headers({ 'X-A': 'existing' });

    appendHeadersRecord(headers, { 'X-A': 'update' }, true);

    expect(headers.get('X-A')).toBe('update');
  });

  it('always appends array values', () => {
    const headers = new Headers({ 'Set-Cookie': 'route=1' });

    appendHeadersRecord(headers, { 'Set-Cookie': ['a=1'] }, false);

    expect(headers.get('Set-Cookie')).toBe('route=1, a=1');
  });

  it('ignores null values', () => {
    const headers = new Headers();

    appendHeadersRecord(headers, { 'X-A': null as unknown as string }, true);

    expect(headers.get('X-A')).toBeNull();
  });
});

describe(mergeHeaderInputs, () => {
  it('replaces a base scalar with an update scalar', () => {
    expect(mergeHeaderInputs({ 'X-A': 'base' }, { 'X-A': 'update' })).toEqual({ 'x-a': 'update' });
  });

  it('concatenates arrays across layers, base first', () => {
    expect(mergeHeaderInputs({ 'Set-Cookie': ['a=1'] }, { 'Set-Cookie': ['b=2'] })).toEqual({
      'set-cookie': ['a=1', 'b=2'],
    });
  });

  it('absorbs a base scalar into an update array', () => {
    expect(mergeHeaderInputs({ 'Set-Cookie': 'a=1' }, { 'Set-Cookie': ['b=2'] })).toEqual({
      'set-cookie': ['a=1', 'b=2'],
    });
  });

  it('replaces a base array with an update scalar', () => {
    expect(mergeHeaderInputs({ 'X-A': ['a', 'b'] }, { 'X-A': 'c' })).toEqual({ 'x-a': 'c' });
  });

  it('collides header names case-insensitively', () => {
    expect(mergeHeaderInputs({ 'x-powered-by': 'base' }, { 'X-Powered-By': 'update' })).toEqual({
      'x-powered-by': 'update',
    });
  });

  it('ignores a null update value instead of unsetting the base value', () => {
    expect(mergeHeaderInputs({ 'X-A': 'base' }, { 'X-A': null as unknown as string })).toEqual({
      'x-a': 'base',
    });
  });

  it('copies arrays instead of aliasing the inputs', () => {
    const base = { 'Set-Cookie': ['a=1'] };
    const merged = mergeHeaderInputs(base, {});

    (merged['set-cookie'] as string[]).push('b=2');

    expect(base['Set-Cookie']).toEqual(['a=1']);
  });
});
