import path from 'path';

import {
  withTypescriptMapping,
  _jestMappingFromTypescriptPaths,
} from '../../src/preset/withTypescriptMapping';

it('generates correct jest module name mapping from typescript paths', () => {
  expect(
    _jestMappingFromTypescriptPaths({
      '@/*': ['./*'],
      '~/*': ['src/*'],
      'multiple/*': ['src/*', './test/*'],
      '@some/package': ['../packages/some-package'],
      '@acme/*': ['./packages/acme/*'],
    })
  ).toMatchObject({
    '^@/(.*)$': '<rootDir>/./$1',
    '^~/(.*)$': '<rootDir>/src/$1',
    '^multiple/(.*)$': ['<rootDir>/src/$1', '<rootDir>/./test/$1'],
    '^@some/package$': '<rootDir>/../packages/some-package',
    '^@acme/(.*)$': '<rootDir>/./packages/acme/$1',
  });
});

it('skips and warns about invalid typescript paths', () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  expect(_jestMappingFromTypescriptPaths({ '@/*': [] })).toEqual({});
  expect(warnSpy).toHaveBeenCalledWith('Skipping empty typescript path map: @/*');

  warnSpy.mockRestore();
});

it('loads for javascript project', () => {
  const currentDir = process.cwd();
  const jsFixturePath = path.resolve(__dirname, '../__fixtures__/javascript');

  try {
    process.chdir(jsFixturePath);
    expect(withTypescriptMapping({ rootDir: '/app' })).toMatchObject({
      rootDir: '/app',
    });
  } finally {
    process.chdir(currentDir);
  }
});

it('loads for typescript project', () => {
  const currentDir = process.cwd();
  const tsFixturePath = path.resolve(__dirname, '../__fixtures__/typescript');

  try {
    process.chdir(tsFixturePath);
    expect(withTypescriptMapping({ rootDir: '/app' })).toMatchObject({
      rootDir: '/app',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/./$1',
      },
    });
  } finally {
    process.chdir(currentDir);
  }
});
