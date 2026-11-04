import spawnAsync from '@expo/spawn-async';

import { openBrowserAsync } from '../open';

const originalPlatform = process.platform;
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.BROWSER;
  delete process.env.BROWSER_ARGS;
});

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform });
  process.env = originalEnv;
});

it.each(['win32', 'linux'])('opens URLs as literal data on %s', async (platform) => {
  Object.defineProperty(process, 'platform', { value: platform });
  process.env.WSL_DISTRO_NAME = 'Ubuntu';
  const target = `https://expo.dev/login?a=1&redirect_uri=http%3A%2F%2Flocalhost&value="'%PATH%!$()^|<> ‘smart’ ‚low‛ 日本語`;

  await openBrowserAsync(target);

  const [command, args, options] = jest.mocked(spawnAsync).mock.calls[0]!;
  expect(command).toMatch(/powershell\.exe$/);
  expect(args?.slice(0, -1)).toEqual(['-NoProfile', '-NonInteractive', '-EncodedCommand']);
  expect(Buffer.from(args![args!.length - 1]!, 'base64').toString('utf16le')).toBe(
    `$ErrorActionPreference = 'Stop'; Start-Process -FilePath '${target.replace(/['‘’‚‛]/g, '$&$&')}'`
  );
  expect(options).toEqual({ stdio: 'ignore' });
});

it('quotes browser paths and arguments without waiting for the browser to exit', async () => {
  Object.defineProperty(process, 'platform', { value: 'win32' });
  process.env.BROWSER = String.raw`C:\Program Files\Browser\browser.exe`;
  process.env.BROWSER_ARGS = '--incognito --profile=kitten&cat';

  await openBrowserAsync('https://expo.dev/login?a=1&b=2');

  const [, args] = jest.mocked(spawnAsync).mock.calls[0]!;
  const script = Buffer.from(args![args!.length - 1]!, 'base64').toString('utf16le');
  expect(script).toBe(
    String.raw`$ErrorActionPreference = 'Stop'; Start-Process -FilePath 'C:\Program Files\Browser\browser.exe' -ArgumentList '"--incognito" "--profile=kitten&cat" "https://expo.dev/login?a=1&b=2"'`
  );
});

it.each([
  ['https://expo.dev/a b', '"https://expo.dev/a b"'],
  ['https://expo.dev/?q="cat"', String.raw`"https://expo.dev/?q=\"cat\""`],
  [String.raw`https://expo.dev/?q=\"cat`, String.raw`"https://expo.dev/?q=\\\"cat"`],
  ['https://expo.dev/path\\', '"https://expo.dev/path\\\\"'],
])('preserves the browser argument %s', async (target, expectedArgument) => {
  Object.defineProperty(process, 'platform', { value: 'win32' });
  process.env.BROWSER = 'browser.exe';

  await openBrowserAsync(target);

  const [, args] = jest.mocked(spawnAsync).mock.calls[0]!;
  const script = Buffer.from(args![args!.length - 1]!, 'base64').toString('utf16le');
  expect(script).toBe(
    `$ErrorActionPreference = 'Stop'; Start-Process -FilePath 'browser.exe' -ArgumentList '${expectedArgument}'`
  );
});

it.each([
  ['win32', String.raw`C:\Missing Browser\browser.exe`],
  ['win32', undefined],
  ['linux', undefined],
])('returns false when launching fails on %s with BROWSER=%s', async (platform, browser) => {
  Object.defineProperty(process, 'platform', { value: platform });
  process.env.WSL_DISTRO_NAME = 'Ubuntu';
  if (browser) process.env.BROWSER = browser;
  jest.mocked(spawnAsync).mockRejectedValueOnce(new Error('Browser launch failed'));

  await expect(openBrowserAsync('https://expo.dev/login?a=1&b=2')).resolves.toBe(false);
});
