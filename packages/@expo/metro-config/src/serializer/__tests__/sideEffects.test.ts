import { _createSideEffectMatcher } from '../sideEffects';

it('matches side effects for boolish values', () => {
  expect(
    _createSideEffectMatcher('/', {
      sideEffects: false,
    })('/file.js')
  ).toBe(false);
  expect(
    _createSideEffectMatcher('/', {
      sideEffects: true,
    })('/file.js')
  ).toBe(true);
  expect(
    _createSideEffectMatcher('/', {
      sideEffects: undefined,
    })('/file.js')
  ).toBe(null);
});
it('matches side effects for empty array', () => {
  expect(
    _createSideEffectMatcher('/', {
      sideEffects: [],
    })('/file.js')
  ).toBe(false);
});
it('matches side effects for matching file', () => {
  const matcher = _createSideEffectMatcher('/', {
    sideEffects: ['file.js'],
  });
  expect(matcher('/file.js')).toBe(true);
  expect(matcher('/other/file.js')).toBe(true);
  //
  expect(matcher('/other/file/foo.js')).toBe(false);
});
it('matches side effects for matching file with glob', () => {
  const matcher = _createSideEffectMatcher('/', {
    sideEffects: ['*.fx.js'],
  });
  expect(matcher('/file.js')).toBe(false);
  expect(matcher('/other/file.js')).toBe(false);
  //
  expect(matcher('/other/file/foo.fx.js')).toBe(true);
});
it('matches side effects with matching path patterns', () => {
  const matcher = _createSideEffectMatcher('/', {
    sideEffects: ['src/asyncRequire/*.ts'],
  });
  expect(matcher('file.js')).toBe(false);
  expect(matcher('file.ts')).toBe(false);
  expect(matcher('other/file.js')).toBe(false);
  expect(matcher('other/file.ts')).toBe(false);
  expect(matcher('src/asyncRequire/file.js')).toBe(false);
  expect(matcher('src/asyncRequire/file.ts')).toBe(true);
});
