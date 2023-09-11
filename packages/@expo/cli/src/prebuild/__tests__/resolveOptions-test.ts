import { vol } from 'memfs';

import {
  ensureValidPlatforms,
  resolvePlatformOption,
  resolveSkipDependencyUpdate,
  resolvePackageManagerOptions,
  resolveTemplateOption,
} from '../resolveOptions';

describe(resolvePackageManagerOptions, () => {
  it(`resolves`, () => {
    expect(resolvePackageManagerOptions({ '--yarn': true })).toEqual({
      npm: undefined,
      pnpm: undefined,
      yarn: true,
    });
  });
  it(`asserts mutually exclusive arguments`, () => {
    expect(() => resolvePackageManagerOptions({ '--npm': true, '--pnpm': true })).toThrow();
    expect(() => resolvePackageManagerOptions({ '--no-install': true, '--yarn': true })).toThrow();
    expect(() =>
      resolvePackageManagerOptions({
        '--npm': true,
        '--pnpm': true,
        '--no-install': true,
        '--yarn': true,
      })
    ).toThrow();
  });
});

describe(resolvePlatformOption, () => {
  const platform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: platform,
    });
  });

  it('returns the correct platforms', () => {
    expect(resolvePlatformOption('ios')).toEqual(['ios']);
    expect(resolvePlatformOption('android')).toEqual(['android']);
  });
  it('returns the correct platforms (darwin)', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });

    expect(resolvePlatformOption('all')).toEqual(['android', 'ios']);
  });
  it('returns the correct platforms (win32)', () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });

    expect(resolvePlatformOption('all')).toEqual(['android']);
  });
  it('accepts unknown platforms', () => {
    expect(resolvePlatformOption('foo')).toEqual(['foo']);
  });
});

describe(resolveSkipDependencyUpdate, () => {
  it('splits dependencies', () => {
    expect(resolveSkipDependencyUpdate(undefined)).toEqual([]);
    expect(resolveSkipDependencyUpdate('')).toEqual([]);
    expect(resolveSkipDependencyUpdate('foo')).toEqual(['foo']);
    expect(resolveSkipDependencyUpdate('foo,bar')).toEqual(['foo', 'bar']);
  });
});

describe(resolveTemplateOption, () => {
  beforeAll(() => {
    vol.fromJSON({
      '/foo': '',
    });
  });
  afterAll(() => {
    vol.reset();
  });
  it('resolves a URL template', () => {
    expect(resolveTemplateOption('http://foo')).toEqual('http://foo');
  });
  it('asserts a missing file path template', () => {
    expect(() => resolveTemplateOption('bacon/bar')).toThrowError(
      /template file does not exist: .*bacon\/bar/
    );
  });
  it('resolves a file path template', () => {
    expect(resolveTemplateOption('/foo')).toEqual('/foo');
  });
});

describe(ensureValidPlatforms, () => {
  const platform = process.platform;
  const warning = console.warn;

  beforeAll(() => {
    console.warn = jest.fn();
  });
  afterAll(() => {
    console.warn = warning;
  });
  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: platform,
    });
  });
  it(`bails on windows if only ios is passed`, async () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });
    expect(ensureValidPlatforms(['ios', 'android'])).toStrictEqual(['android']);
  });
  it(`allows ios on all platforms except windows`, async () => {
    Object.defineProperty(process, 'platform', {
      value: 'other',
    });
    expect(ensureValidPlatforms(['ios', 'android'])).toStrictEqual(['ios', 'android']);
  });
});
