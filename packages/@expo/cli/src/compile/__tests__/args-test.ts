import type { CompileRequest } from '@ramonclaudio/compile';
import path from 'path';

import { CommandError } from '../../utils/errors';
import { parseCompileArgs, resolveCompileRequest } from '../args';

function parseRequest(argv: readonly string[], platform?: CompileRequest['platform']) {
  const parsed = parseCompileArgs(argv, platform);
  if (parsed.kind !== 'compile' || !parsed.platform) {
    throw new Error('Expected a compile request with a platform.');
  }
  return resolveCompileRequest(parsed, parsed.platform);
}

describe(parseCompileArgs, () => {
  it.each(['--help', '-h'])('shows help with %s without a mode or project', (flag) => {
    expect(parseCompileArgs([flag])).toEqual({ kind: 'help' });
    expect(parseCompileArgs(['/missing/project', flag], 'ios')).toEqual({ kind: 'help' });
  });

  it.each(['ios', 'android'] as const)('accepts the explicit %s subcommand', (platform) => {
    expect(parseCompileArgs([platform, '--dev'])).toMatchObject({
      kind: 'compile',
      platform,
      projectRoot: process.cwd(),
    });
  });

  it('leaves platform selection to the caller when omitted', () => {
    expect(parseCompileArgs(['--dev'])).toMatchObject({
      kind: 'compile',
      platform: undefined,
      projectRoot: process.cwd(),
    });
    const parsed = parseCompileArgs(['--prod']);
    expect(parsed).toMatchObject({
      kind: 'compile',
      platform: undefined,
      projectRoot: process.cwd(),
    });
    if (parsed.kind !== 'compile') throw new Error('Expected compile options.');
    expect(resolveCompileRequest(parsed, 'android')).toEqual({
      platform: 'android',
      cwd: process.cwd(),
      mode: 'production',
      outputType: 'apk',
      outputDir: undefined,
    });
  });

  it.each([
    ['ios', './project with spaces', '--dev'],
    ['--dev', 'ios', './project with spaces'],
    ['ios', '--dev', './project with spaces'],
  ])('accepts a project path among flags: %j', (...argv) => {
    expect(parseCompileArgs(argv)).toMatchObject({
      platform: 'ios',
      projectRoot: path.resolve('project with spaces'),
    });
  });

  it('treats the first positional as a project path for a platform command', () => {
    expect(parseCompileArgs(['android', '--dev'], 'ios')).toMatchObject({
      platform: 'ios',
      projectRoot: path.resolve('android'),
    });
  });

  it.each([
    ['--dev', 'development'],
    ['--development', 'development'],
    ['--prod', 'production'],
    ['--production', 'production'],
  ])('selects mode with %s', (flag, mode) => {
    expect(parseRequest([flag], 'ios').mode).toBe(mode);
  });

  it.each([
    ['--dev', '--development'],
    ['--prod', '--production'],
  ])('accepts aliases for the same mode: %j', (...argv) => {
    expect(() => parseCompileArgs(argv, 'ios')).not.toThrow();
  });

  it.each([
    [],
    ['--dev', '--prod'],
    ['--dev', '--production'],
    ['--development', '--prod'],
    ['--development', '--production'],
  ])('requires one explicit mode: %j', (...argv) => {
    expect(() => parseCompileArgs(argv, 'ios')).toThrow(
      new CommandError('BAD_ARGS', 'Choose exactly one mode: --dev or --prod.')
    );
  });

  it.each([
    ['--scheme', 'App'],
    ['--configuration', 'Debug'],
    ['--variant', 'debug'],
    ['--variants', 'debug'],
    ['--platform', 'ios'],
    ['--no-install'],
    ['--dev=false'],
    ['--output-dir'],
    ['--output-type'],
    ['--output-dir', '--dev'],
  ])('rejects unsupported or malformed flags: %j', (...argv) => {
    expect(() => parseCompileArgs(['--dev', ...argv], 'ios')).toThrow(CommandError);
  });

  it.each([
    ['ios', 'first', 'second', '--dev'],
    ['android', 'first', 'second', '--dev'],
  ])('rejects extra project arguments: %j', (...argv) => {
    expect(() => parseCompileArgs(argv)).toThrow('Unexpected argument "second".');
  });

  it.each(['windows', 'IOS', 'andriod', './project'])(
    'rejects unsupported platform %s',
    (platform) => {
      expect(() => parseCompileArgs([platform, '--dev'])).toThrow(
        `Platform must be "ios" or "android". Got "${platform}".`
      );
    }
  );

  it('rejects extra project arguments in a platform command', () => {
    expect(() => parseCompileArgs(['first', 'second', '--dev'], 'android')).toThrow(
      'Unexpected argument "second".'
    );
  });

  it('respects the option separator for project paths', () => {
    expect(parseCompileArgs(['--dev', '--', '--device'], 'ios')).toMatchObject({
      projectRoot: path.resolve('--device'),
      device: undefined,
    });
  });

  it('keeps the caller argument array unchanged', () => {
    const argv = Object.freeze(['ios', '--device', '--dev']);
    parseCompileArgs(argv);
    expect(argv).toEqual(['ios', '--device', '--dev']);
  });
});

describe(resolveCompileRequest, () => {
  it('defaults to an iOS simulator app', () => {
    expect(parseRequest(['--dev'], 'ios')).toEqual({
      platform: 'ios',
      cwd: process.cwd(),
      mode: 'development',
      outputType: 'app',
      outputDir: undefined,
      destination: { kind: 'simulator' },
    });
  });

  it.each([
    ['--dev', '--device'],
    ['--device', '--dev'],
    ['--dev', '--device=generic'],
    ['--dev', '--device', 'generic'],
  ])('selects a generic iOS device: %j', (...argv) => {
    expect(parseRequest(argv, 'ios')).toMatchObject({ destination: { kind: 'device' } });
  });

  it.each(['00008110-001A12340A10001E', 'aBc-123'])('keeps the device identifier %s', (id) => {
    expect(parseRequest(['--dev', '--device', id], 'ios')).toMatchObject({
      destination: { kind: 'device', id },
    });
  });

  it.each(['', 'id,name=Injected', 'iPhone 17', '../device'])('rejects device ID %j', (id) => {
    expect(() => parseRequest(['--dev', `--device=${id}`], 'ios')).toThrow(
      'Device ID must contain only letters, numbers, and hyphens.'
    );
  });

  it('allows bare device before the short help alias', () => {
    expect(parseCompileArgs(['--device', '-h'], 'ios')).toEqual({ kind: 'help' });
  });

  it('requires a device destination for IPA export', () => {
    expect(() => parseRequest(['--prod', '--output-type', 'ipa'], 'ios')).toThrow(
      'IPA export requires --device.'
    );
    expect(parseRequest(['--prod', '--device', '--output-type', 'ipa'], 'ios')).toMatchObject({
      outputType: 'ipa',
      destination: { kind: 'device' },
    });
  });

  it.each(['app', 'ipa'])('accepts the iOS output type %s', (outputType) => {
    expect(parseRequest(['--dev', '--device', '--output-type', outputType], 'ios')).toMatchObject({
      outputType,
    });
  });

  it.each(['apk', 'aab', 'APP', 'xcarchive', ''])('rejects the iOS output type %j', (type) => {
    expect(() => parseRequest(['--dev', `--output-type=${type}`], 'ios')).toThrow(
      'The iOS command supports output types "app" and "ipa".'
    );
  });

  it('defaults to an Android APK', () => {
    expect(parseRequest(['--prod'], 'android')).toEqual({
      platform: 'android',
      cwd: process.cwd(),
      mode: 'production',
      outputType: 'apk',
      outputDir: undefined,
    });
  });

  it.each(['apk', 'aab'])('accepts the Android output type %s', (outputType) => {
    expect(parseRequest(['--dev', '--output-type', outputType], 'android')).toMatchObject({
      outputType,
    });
  });

  it.each(['app', 'ipa', 'APK', 'jar', ''])('rejects the Android output type %j', (type) => {
    expect(() => parseRequest(['--dev', `--output-type=${type}`], 'android')).toThrow(
      'The Android command supports output types "apk" and "aab".'
    );
  });

  it.each(['--dev', '--prod'])('accepts Android device targeting in %s mode', (mode) => {
    expect(parseRequest([mode, '--device'], 'android')).toMatchObject({ device: 'generic' });
    for (const device of ['emulator-5554', '192.168.1.4:5555', 'adb-123._adb-tls-connect._tcp']) {
      expect(parseRequest([mode, '--device', device], 'android')).toMatchObject({ device });
    }
  });

  it('rejects Android device targeting for AAB without changing the requested output', () => {
    expect(() => parseRequest(['--prod', '--device', '--output-type', 'aab'], 'android')).toThrow(
      'Android device targeting requires --output-type apk.'
    );
  });

  it('rejects an empty Android device ID', () => {
    expect(() => parseRequest(['--dev', '--device='], 'android')).toThrow(
      'Android device ID cannot be empty.'
    );
  });

  it('keeps relative output directories unchanged', () => {
    expect(
      parseRequest(['./my-project', '--dev', '--output-dir', '../artifacts with spaces'], 'android')
    ).toMatchObject({
      cwd: path.resolve('my-project'),
      outputDir: '../artifacts with spaces',
    });
  });

  it('preserves an absolute output directory', () => {
    expect(parseRequest(['--prod', '--output-dir=/tmp/build outputs'], 'ios')).toMatchObject({
      outputDir: '/tmp/build outputs',
    });
  });
});
