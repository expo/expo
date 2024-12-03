import { vol } from 'memfs';
import path from 'path';

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
  afterEach(() => {
    vol.reset();
  });

  it('resolves GitHub shorthand', () => {
    expect(resolveTemplateOption('expo/template-repo')).toEqual({
      type: 'repository',
      uri: 'https://github.com/expo/template-repo',
    });
  });

  it('resolves GitHub shorthand using repository path', () => {
    expect(resolveTemplateOption('expo/expo/templates/expo-template-bare-minimum')).toEqual({
      type: 'repository',
      uri: 'https://github.com/expo/expo/templates/expo-template-bare-minimum',
    });
  });
  it('resolves a URL template', () => {
    expect(resolveTemplateOption('http://foo')).toEqual({
      type: 'repository',
      uri: 'http://foo',
    });
  });
  it('asserts a missing file path template', () => {
    expect(() => resolveTemplateOption('./bacon/bar')).toThrowError(
      /template file does not exist: .*bacon\/bar/
    );
  });
  it('resolves a file path template', () => {
    vol.fromJSON({
      '/foo': '',
    });

    expect(resolveTemplateOption('/foo')).toEqual({
      type: 'file',
      uri: '/foo',
    });
  });

  it('should return type "repository" for HTTP URLs', () => {
    const template = 'https://github.com/user/repo';
    const result = resolveTemplateOption(template);
    expect(result).toEqual({ type: 'repository', uri: template });
  });

  it('should return type "repository" for HTTPS URLs', () => {
    const template = 'http://github.com/user/repo';
    const result = resolveTemplateOption(template);
    expect(result).toEqual({ type: 'repository', uri: template });
  });

  it('should return type "file" for file URLs', () => {
    const template = 'file:./path/to/template.tgz';
    const resolvedPath = path.resolve('./path/to/template.tgz');
    vol.fromJSON({
      './path/to/template.tgz': '',
    });
    const result = resolveTemplateOption(template);
    expect(result).toEqual({ type: 'file', uri: resolvedPath });
  });

  it('should return type "file" for relative paths', () => {
    const template = './path/to/template.tgz';
    const resolvedPath = path.resolve(template);
    vol.fromJSON({
      './path/to/template.tgz': '',
    });
    const result = resolveTemplateOption(template);
    expect(result).toEqual({ type: 'file', uri: resolvedPath });
  });

  it('should return type "file" for absolute paths', () => {
    const template = path.sep + 'path' + path.sep + 'to' + path.sep + 'template.tgz';
    const resolvedPath = path.resolve(template);
    vol.fromJSON({
      '/path/to/template.tgz': '',
    });
    const result = resolveTemplateOption(template);
    expect(result).toEqual({ type: 'file', uri: resolvedPath });
  });

  it('should throw an error if the file does not exist', () => {
    const template = './path/to/nonexistent/template.tgz';
    expect(() => resolveTemplateOption(template)).toThrow(/^template file does not exist:/);
  });

  it('should return type "npm" for other strings', () => {
    const template = 'some-npm-package';
    const result = resolveTemplateOption(template);
    expect(result).toEqual({ type: 'npm', uri: template });
  });

  it('should return type "file" for ambiguous arg and matching local file', () => {
    const template = 'template.tgz';
    const resolvedPath = path.resolve(template);
    vol.fromJSON({
      'template.tgz': '',
    });
    const result = resolveTemplateOption(template);
    expect(result).toEqual({ type: 'file', uri: resolvedPath });
  });

  it('should return type "npm" for ambiguous arg and not matching local file', () => {
    const template = 'nonexistent';
    const result = resolveTemplateOption(template);
    expect(result).toEqual({ type: 'npm', uri: template });
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
