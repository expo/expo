import { freePortAsync, testPortAsync } from '../freeport';
import { getRunningProcess } from '../getRunningProcess';
import { isInteractive } from '../interactive';
import {
  choosePortAsync,
  ensurePortAvailabilityAsync,
  resolveMetroPortAsync,
  _resolvePortAsync,
} from '../port';
import { confirmAsync } from '../prompts';

jest.mock('../freeport', () => ({
  testPortAsync: jest.fn(async (_port) => true),
  freePortAsync: jest.fn(async (port) => port),
}));

jest.mock('../../log');
jest.mock('../prompts');
jest.mock('../interactive', () => ({
  isInteractive: jest.fn(() => true),
}));
jest.mock('../getRunningProcess', () => ({
  getRunningProcess: jest.fn(() => null),
}));

beforeEach(() => {
  delete process.env.RCT_METRO_PORT;
});

describe(ensurePortAvailabilityAsync, () => {
  it(`returns true if the port is available`, async () => {
    jest.mocked(testPortAsync).mockResolvedValueOnce(true);
    expect(await ensurePortAvailabilityAsync('/', { port: 8081 })).toBe(true);
  });
  it(`returns false if the port is unavailable due to running the same process`, async () => {
    jest.mocked(getRunningProcess).mockResolvedValueOnce({
      pid: 1,
      directory: '/me',
      command: 'npx expo',
    });
    jest.mocked(testPortAsync).mockResolvedValueOnce(false);
    expect(await ensurePortAvailabilityAsync('/me', { port: 8081 })).toBe(false);
  });
  it(`asserts if the port is busy because it's running a different process`, async () => {
    jest.mocked(getRunningProcess).mockResolvedValueOnce({
      pid: 1,
      directory: '/other',
      command: 'npx expo',
    });
    jest.mocked(testPortAsync).mockResolvedValueOnce(false);
    await expect(ensurePortAvailabilityAsync('/me', { port: 8081 })).rejects.toThrow();
  });
});

describe(choosePortAsync, () => {
  it(`returns any port when given port is 0`, async () => {
    jest.mocked(freePortAsync).mockResolvedValueOnce(1024);
    const port = await choosePortAsync('/', { defaultPort: 0 });
    expect(port).toBe(1024);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`returns same port when given port is available`, async () => {
    jest.mocked(freePortAsync).mockResolvedValueOnce(8081);
    const port = await choosePortAsync('/', { defaultPort: 8081 });
    expect(port).toBe(8081);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`chooses a new port if the default port is taken and isn't running the same process`, async () => {
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    jest.mocked(getRunningProcess).mockResolvedValueOnce({
      pid: 1,
      directory: '/other/project',
      command: 'npx expo',
    });
    jest.mocked(confirmAsync).mockResolvedValueOnce(true);
    const port = await choosePortAsync('/', { defaultPort: 8081, reuseExistingPort: false });
    expect(port).toBe(8082);
    expect(confirmAsync).toHaveBeenCalledWith({ initial: true, message: 'Use port 8082 instead?' });
  });
  it(`returns null if the new suggested port is rejected`, async () => {
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    jest.mocked(getRunningProcess).mockResolvedValueOnce({
      pid: 1,
      directory: '/other/project',
      command: 'npx expo',
    });
    jest.mocked(confirmAsync).mockResolvedValueOnce(false);
    const port = await choosePortAsync('/', { defaultPort: 8081, reuseExistingPort: false });
    expect(port).toBe(null);
    expect(confirmAsync).toHaveBeenCalledWith({ initial: true, message: 'Use port 8082 instead?' });
  });
  it(`returns null if the taken port is running the same process`, async () => {
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    jest.mocked(getRunningProcess).mockResolvedValueOnce({
      pid: 1,
      directory: '/me',
      command: 'npx expo',
    });
    jest.mocked(confirmAsync).mockResolvedValueOnce(false);
    const port = await choosePortAsync('/me', { defaultPort: 8081, reuseExistingPort: true });
    expect(port).toBe(null);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`chooses the next free port without prompting for a default port in non-interactive mode`, async () => {
    jest.mocked(isInteractive).mockReturnValueOnce(false);
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    jest.mocked(getRunningProcess).mockResolvedValueOnce({
      pid: 1,
      directory: '/other/project',
      command: 'npx expo',
    });
    const port = await choosePortAsync('/', { defaultPort: 8081, reuseExistingPort: false });
    expect(port).toBe(8082);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`hard-fails for an explicitly requested busy port in non-interactive mode`, async () => {
    jest.mocked(isInteractive).mockReturnValueOnce(false);
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    jest.mocked(getRunningProcess).mockResolvedValueOnce({
      pid: 1,
      directory: '/other/project',
      command: 'npx expo',
    });
    await expect(
      choosePortAsync('/', { defaultPort: 8081, explicitPort: true, reuseExistingPort: false })
    ).rejects.toThrow(/Port 8081 is unavailable/);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`still reuses the same-process port in non-interactive mode`, async () => {
    jest.mocked(isInteractive).mockReturnValueOnce(false);
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    jest.mocked(getRunningProcess).mockResolvedValueOnce({
      pid: 1,
      directory: '/me',
      command: 'npx expo',
    });
    const port = await choosePortAsync('/me', { defaultPort: 8081, reuseExistingPort: true });
    expect(port).toBe(null);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
});

describe(_resolvePortAsync, () => {
  it.each([NaN, -1, 8081.5, Infinity, 65_536])(
    `uses the preferred port when the requested port is invalid: %s`,
    async (defaultPort) => {
      const port = await _resolvePortAsync('/', { defaultPort, preferredPort: 8081 });
      expect(port).toBe(8081);
      expect(freePortAsync).toHaveBeenCalledWith(8081, [null]);
    }
  );
  it(`finds the first available port from the preferred port when port is 0`, async () => {
    jest.mocked(freePortAsync).mockResolvedValueOnce(8081);
    const port = await _resolvePortAsync('/', { defaultPort: 0, preferredPort: 8081 });
    expect(port).toBe(8081);
    expect(freePortAsync).toHaveBeenCalledWith(8081, [null, 'localhost']);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`finds the next available port from the preferred port when port is 0 and it is busy`, async () => {
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    const port = await _resolvePortAsync('/', { defaultPort: 0, preferredPort: 8081 });
    expect(port).toBe(8082);
    expect(freePortAsync).toHaveBeenCalledWith(8081, [null, 'localhost']);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`rolls over to the next free port when the preferred port is busy in non-interactive mode`, async () => {
    jest.mocked(isInteractive).mockReturnValueOnce(false);
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    const port = await _resolvePortAsync('/', { preferredPort: 8081 });
    expect(port).toBe(8082);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`hard-fails when an explicit --port is busy in non-interactive mode`, async () => {
    jest.mocked(isInteractive).mockReturnValueOnce(false);
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    await expect(
      _resolvePortAsync('/', { defaultPort: 8081, preferredPort: 8081 })
    ).rejects.toThrow(/Port 8081 is unavailable/);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`rolls over instead of hard-failing when an invalid --port is busy in non-interactive mode`, async () => {
    jest.mocked(isInteractive).mockReturnValueOnce(false);
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    const port = await _resolvePortAsync('/', { defaultPort: NaN, preferredPort: 8081 });
    expect(port).toBe(8082);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`hard-fails when an explicitly requested preferred port is busy in non-interactive mode`, async () => {
    jest.mocked(isInteractive).mockReturnValueOnce(false);
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    await expect(
      _resolvePortAsync('/', { preferredPort: 8081, isPreferredPortExplicit: true })
    ).rejects.toThrow(/Port 8081 is unavailable/);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`ignores RCT_METRO_PORT`, async () => {
    process.env.RCT_METRO_PORT = '9999';
    const port = await _resolvePortAsync('/', { preferredPort: 8081 });
    expect(port).toBe(8081);
    expect(freePortAsync).toHaveBeenCalledWith(8081, [null]);
  });
  it(`leaves RCT_METRO_PORT alone`, async () => {
    await _resolvePortAsync('/', { preferredPort: 8081 });
    expect(process.env.RCT_METRO_PORT).toBeUndefined();
  });
});

describe(resolveMetroPortAsync, () => {
  it(`prefers RCT_METRO_PORT over the fallback`, async () => {
    process.env.RCT_METRO_PORT = '9000';
    const port = await resolveMetroPortAsync('/', { fallbackPort: 8081 });
    expect(port).toBe(9000);
  });
  it(`scans from RCT_METRO_PORT when --port is 0`, async () => {
    process.env.RCT_METRO_PORT = '9000';
    jest.mocked(freePortAsync).mockResolvedValueOnce(9001);
    const port = await resolveMetroPortAsync('/', { defaultPort: 0, fallbackPort: 8081 });
    expect(port).toBe(9001);
    expect(freePortAsync).toHaveBeenCalledWith(9000, [null, 'localhost']);
  });
  it(`writes the resolved port back to RCT_METRO_PORT`, async () => {
    const port = await resolveMetroPortAsync('/', { defaultPort: 3000, fallbackPort: 8081 });
    expect(port).toBe(3000);
    expect(process.env.RCT_METRO_PORT).toBe('3000');
  });
  it(`uses and writes back the fallback when --port parsing returns NaN`, async () => {
    const port = await resolveMetroPortAsync('/', { defaultPort: NaN, fallbackPort: 8081 });
    expect(port).toBe(8081);
    expect(process.env.RCT_METRO_PORT).toBe('8081');
  });
  it(`uses the fallback when RCT_METRO_PORT is out of range`, async () => {
    process.env.RCT_METRO_PORT = '65536';
    const port = await resolveMetroPortAsync('/', { fallbackPort: 8081 });
    expect(port).toBe(8081);
    expect(freePortAsync).toHaveBeenCalledWith(8081, [null]);
  });
  it(`falls back to 8081 when nothing requests a port`, async () => {
    const port = await resolveMetroPortAsync('/');
    expect(port).toBe(8081);
  });
  it(`hard-fails when a configured RCT_METRO_PORT is busy in non-interactive mode`, async () => {
    process.env.RCT_METRO_PORT = '8081';
    jest.mocked(isInteractive).mockReturnValueOnce(false);
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    await expect(resolveMetroPortAsync('/', { fallbackPort: 8081 })).rejects.toThrow(
      /Port 8081 is unavailable/
    );
  });
  it(`leaves RCT_METRO_PORT alone when the dev server is skipped`, async () => {
    jest.mocked(getRunningProcess).mockResolvedValueOnce({
      pid: 1,
      directory: '/',
      command: 'npx expo',
    });
    jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
    const port = await resolveMetroPortAsync('/', {
      fallbackPort: 8081,
      reuseExistingPort: true,
    });
    expect(port).toBe(null);
    expect(process.env.RCT_METRO_PORT).toBeUndefined();
  });
});
