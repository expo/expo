import { _dependenciesToRegex } from '../createExpoStickyResolver';

// NOTE(@kitten): This tests converting and matching dependencies from a generated regex
// To see a more complete test for `createStickyModuleResolver` itself, see: withMetroMultiPlatform.test.ts
describe(_dependenciesToRegex, () => {
  it.each([
    // Positive tests: dependencyName, input, [match1, match2]
    ['react', 'react', ['react', '']],
    ['react-dom', 'react-dom', ['react-dom', '']],
    ['react-dom', 'react-dom/test', ['react-dom', '/test']],
    ['@babel/runtime', '@babel/runtime', ['@babel/runtime', '']],
    ['@babel/runtime', '@babel/runtime/helpers/test', ['@babel/runtime', '/helpers/test']],
    ['library.js', 'library.js', ['library.js', '']],
    ['library.js', 'library.js/test', ['library.js', '/test']],
    ['a_dep', 'a_dep', ['a_dep', '']],

    // Negative tests: dependencyName, input, `null`
    ['react', 'react-dom', null],
    ['react-dom', './react-dom', null],
    ['react-dom', '/react-dom', null],
    ['@babel/runtime', '@babel/helpers', null],
    ['@babel/runtime', '@babel/helpers/test', null],
    ['library.js', 'anything', null],
  ])('expect dependency %s with match "%s" to output `%s`', (dependencyName, input, match) => {
    const re = _dependenciesToRegex([dependencyName]);
    let exec = re.exec(input);
    if (match !== null) {
      expect(exec?.[0]).toEqual(input);
      expect(exec?.[1]).toEqual(match[0]);
      expect(exec?.[2]).toEqual(match[1]);
      exec = re.exec('');
      expect(exec).toEqual(null);
    } else {
      expect(exec).toEqual(null);
    }
  });
});
