import type { DependencyResolution } from '../types';
import {
  defaultShouldIncludeDependency,
  filterMapResolutionResult,
  mergeResolutionResults,
  mergeWithDuplicate,
} from '../utils';

describe(defaultShouldIncludeDependency, () => {
  it.each([
    ['@babel/core', false],
    ['@babel/plugin-transform-commonjs', false],
    ['@eslint/plugin-core', false],
    ['eslint', false],
    ['eslint-config-expo', false],
    ['@typescript-eslint/test', false],
    ['@types/node', false],
    ['@expo/env', false],
    ['react-native', true],
    ['expo', true],
    ['expo-audio', true],
    ['react-native-third-party', true],
  ])('%s returns %b', (name, expected) => {
    expect(defaultShouldIncludeDependency(name)).toBe(expected);
  });
});

describe(mergeWithDuplicate, () => {
  const BASE_RESOLUTION: DependencyResolution = {
    name: 'test',
    version: '',
    path: '/fake/path',
    originPath: '/fake/path',
    duplicates: null,
    depth: 0,
  };

  it('prefers lowest depth first', () => {
    const a = { ...BASE_RESOLUTION, depth: 1 };
    const b = { ...BASE_RESOLUTION, depth: 2 };
    expect(mergeWithDuplicate(a, b)).toBe(a);
    expect(mergeWithDuplicate(b, a)).toBe(a);
    a.depth = 4;
    b.depth = 3;
    expect(mergeWithDuplicate(a, b)).toBe(b);
    expect(mergeWithDuplicate(b, a)).toBe(b);
  });

  it('copies duplicate path to returned resolution', () => {
    const a = { ...BASE_RESOLUTION, path: 'a' };
    const b = { ...BASE_RESOLUTION, path: 'b' };
    expect(mergeWithDuplicate(a, b)).toMatchObject({
      path: 'a',
      duplicates: [expect.objectContaining({ path: 'b' })],
    });
  });

  it('merges duplicates', () => {
    const a = {
      ...BASE_RESOLUTION,
      path: 'x',
      duplicates: [{ ...BASE_RESOLUTION, path: 'a' }],
    };
    const b = {
      ...BASE_RESOLUTION,
      path: 'b',
      duplicates: [{ ...BASE_RESOLUTION, path: 'c' }],
    };
    expect(mergeWithDuplicate(a, b)).toMatchObject({
      path: 'x',
      duplicates: [
        expect.objectContaining({ path: 'a' }),
        expect.objectContaining({ path: 'b' }),
        expect.objectContaining({ path: 'c' }),
      ],
    });
  });

  it('merges duplicates and deduplicates', () => {
    const a = {
      ...BASE_RESOLUTION,
      path: 'x',
      duplicates: [{ ...BASE_RESOLUTION, path: 'a' }],
    };
    const b = {
      ...BASE_RESOLUTION,
      path: 'b',
      duplicates: [{ ...BASE_RESOLUTION, path: 'a' }],
    };
    expect(mergeWithDuplicate(a, b)).toMatchObject({
      path: 'x',
      duplicates: [expect.objectContaining({ path: 'a' }), expect.objectContaining({ path: 'b' })],
    });
  });
});

describe(mergeResolutionResults, () => {
  const BASE_RESOLUTION: DependencyResolution = {
    name: 'test',
    version: '',
    path: '/fake/path',
    originPath: '/fake/path',
    duplicates: null,
    depth: 0,
  };

  it('merges results, preferring earlier results', () => {
    const a1 = { ...BASE_RESOLUTION, name: 'a', path: '1' };
    const a2 = { ...BASE_RESOLUTION, name: 'a', path: '2' };
    const b = { ...BASE_RESOLUTION, name: 'b', path: 'b' };
    expect(mergeResolutionResults([{ a: a1, b }, { a: a2 }])).toEqual({
      a: {
        ...a1,
        duplicates: [expect.objectContaining({ path: '2' })],
      },
      b,
    });
  });

  it('returns reference equal result for single input', () => {
    const input = { a: { ...BASE_RESOLUTION, name: 'a' } };
    expect(mergeResolutionResults([input])).toBe(input);
  });
});

describe(filterMapResolutionResult, () => {
  const BASE_RESOLUTION: DependencyResolution = {
    name: 'test',
    version: '',
    path: '/fake/path',
    originPath: '/fake/path',
    duplicates: null,
    depth: 0,
  };

  it('concurrently maps and filters entries', async () => {
    const a = { ...BASE_RESOLUTION, name: 'a' };
    const b = { ...BASE_RESOLUTION, name: 'b' };
    const c = { ...BASE_RESOLUTION, name: 'c' };

    const result = await filterMapResolutionResult({ a, b, c }, async (resolution) => {
      switch (resolution.name) {
        case 'c':
          return null;
        default:
          return { name: resolution.name, special: `${resolution.name}!` };
      }
    });

    expect(result).toEqual({
      a: { name: 'a', special: 'a!' },
      b: { name: 'b', special: 'b!' },
    });
  });
});
