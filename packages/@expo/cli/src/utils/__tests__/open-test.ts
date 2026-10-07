import spawnAsync from '@expo/spawn-async';

import { openBrowserAsync } from '../open';

const originalPlatform = process.platform;

function setPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { value: platform });
}

beforeEach(() => {
  delete process.env.BROWSER;
  delete process.env.BROWSER_ARGS;
});

afterEach(() => {
  setPlatform(originalPlatform);
});

describe('openBrowserAsync on Windows', () => {
  it('opens a plain URL via powershell Start-Process instead of cmd.exe start', async () => {
    setPlatform('win32');

    // A real Expo CLI login URL shape - the `&` characters here are exactly what broke
    // the old `cmd.exe /c start` implementation, since cmd.exe treats an unquoted `&`
    // as a command separator no matter how the target argument itself was quoted.
    const target =
      'https://expo.dev/login?client_id=expo-cli&redirect_uri=http://localhost:8081/auth/callback&state=abc123';

    await openBrowserAsync(target);

    expect(spawnAsync).toHaveBeenCalledTimes(1);
    const [command, args] = jest.mocked(spawnAsync).mock.calls[0]!;
    expect(command).toMatch(/powershell\.exe$/i);
    expect(command).not.toMatch(/cmd\.exe$/i);
    // The URL must survive completely intact as a single argument value - not split on `&`.
    expect(args).toContain('-Command');
    const psCommand = (args as string[]).find((arg) => arg.includes('Start-Process'));
    expect(psCommand).toBe(`Start-Process -FilePath '${target}'`);
  });

  it('quotes a literal single quote in the URL so it cannot break out of the PowerShell string', async () => {
    setPlatform('win32');
    const target = "https://example.com/?name=O'Brien";

    await openBrowserAsync(target);

    const [, args] = jest.mocked(spawnAsync).mock.calls[0]!;
    const psCommand = (args as string[]).find((arg) => arg.includes('Start-Process'));
    expect(psCommand).toBe("Start-Process -FilePath 'https://example.com/?name=O''Brien'");
  });

  it('routes the target through a BROWSER override app, forwarding BROWSER_ARGS ahead of it', async () => {
    setPlatform('win32');
    process.env.BROWSER = 'C:\\Program Files\\Firefox\\firefox.exe';
    process.env.BROWSER_ARGS = '-private -foreground';
    const target = 'https://expo.dev/login?a=1&b=2';

    await openBrowserAsync(target);

    const [, args] = jest.mocked(spawnAsync).mock.calls[0]!;
    const psCommand = (args as string[]).find((arg) => arg.includes('Start-Process'));
    expect(psCommand).toBe(
      "Start-Process -FilePath 'C:\\Program Files\\Firefox\\firefox.exe' -ArgumentList '-private','-foreground','https://expo.dev/login?a=1&b=2'"
    );
  });
});
