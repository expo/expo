import { TESTS } from '../../e2e/TestSuite-test.native';

const { getTestsToRun } = require('./e2e-common');

describe('getTestsToRun', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('TESTS contains all test names that deep link to the respective screen in test suite', () => {
    expect(TESTS).toEqual([
      'Basic',
      'LinearGradient',
      'Constants',
      'Crypto',
      'Haptics',
      'Localization',
      'SQLite',
      'KeepAwake',
      'FileSystem',
      'Fetch',
    ]);
  });

  it('returns Basic test for empty input', () => {
    const result = getTestsToRun([]);
    expect(result).toEqual(['Basic']);
    expect(console.log).toHaveBeenCalledWith(
      'No e2e tests found for modified locations, running Basic test only'
    );
  });

  it('returns Basic test for unmapped package', () => {
    const result = getTestsToRun(['apps/expo-go/ios/Podfile.lock']);
    expect(result).toEqual(['Basic']);
    expect(console.log).toHaveBeenCalledWith(
      'No e2e tests found for modified locations, running Basic test only'
    );
  });

  it('returns tests based on changed path', () => {
    const result2 = getTestsToRun(['packages/expo-haptics/package.json']);
    expect(result2).toEqual(['Haptics', 'Basic']);

    const result3 = getTestsToRun([
      'packages/expo-haptics/package.json',
      'apps/expo-go/ios/Podfile.lock',
    ]);
    expect(result3).toEqual(['Haptics', 'Basic']);
  });

  it('returns all tests for selected paths', () => {
    const result = getTestsToRun(['.github/workflows/test-suite.yml', 'packages/expo-constants']);
    expect(console.log).toHaveBeenCalledWith(
      'Running all because of location: .github/workflows/test-suite.yml'
    );
    expect(result).toBe(TESTS);

    // expo package changes should also run all tests
    const result2 = getTestsToRun(['packages/expo/some-file.js']);
    expect(result2).toBe(TESTS);
  });
});
