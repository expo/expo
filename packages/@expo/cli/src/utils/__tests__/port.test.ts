// @ts-expect-error
import freeportAsync from 'freeport-async';

import { getRunningProcess } from '../getRunningProcess';
import { choosePortAsync, ensurePortAvailabilityAsync } from '../port';
import { confirmAsync } from '../prompts';

jest.mock('../../log');
jest.mock('freeport-async', () => jest.fn(async (port) => port));
jest.mock('../prompts');
jest.mock('../getRunningProcess', () => ({
  getRunningProcess: jest.fn(() => null),
}));

describe(ensurePortAvailabilityAsync, () => {
  it(`returns true if the port is available`, async () => {
    jest.mocked(freeportAsync).mockResolvedValueOnce(8081);
    expect(await ensurePortAvailabilityAsync('/', { port: 8081 })).toBe(true);
  });
  it(`returns false if the port is unavailable due to running the same process`, async () => {
    jest.mocked(getRunningProcess).mockReturnValueOnce({
      pid: 1,
      directory: '/me',
      command: 'npx expo',
    });
    jest.mocked(freeportAsync).mockResolvedValueOnce(8082);
    expect(await ensurePortAvailabilityAsync('/me', { port: 8081 })).toBe(false);
  });
  it(`asserts if the port is busy because it's running a different process`, async () => {
    jest.mocked(getRunningProcess).mockReturnValueOnce({
      pid: 1,
      directory: '/other',
      command: 'npx expo',
    });
    jest.mocked(freeportAsync).mockResolvedValueOnce(8082);
    await expect(ensurePortAvailabilityAsync('/me', { port: 8081 })).rejects.toThrow();
  });
});

describe(choosePortAsync, () => {
  it(`returns same port when given port is available`, async () => {
    jest.mocked(freeportAsync).mockResolvedValueOnce(8081);
    const port = await choosePortAsync('/', { defaultPort: 8081 });
    expect(port).toBe(8081);
    expect(confirmAsync).not.toHaveBeenCalled();
  });
  it(`chooses a new port if the default port is taken and isn't running the same process`, async () => {
    jest.mocked(freeportAsync).mockResolvedValueOnce(8082);
    jest.mocked(getRunningProcess).mockReturnValueOnce({
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
    jest.mocked(freeportAsync).mockResolvedValueOnce(8082);
    jest.mocked(getRunningProcess).mockReturnValueOnce({
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
    jest.mocked(freeportAsync).mockResolvedValueOnce(8082);
    jest.mocked(getRunningProcess).mockReturnValueOnce({
      pid: 1,
      directory: '/me',
      command: 'npx expo',
    });
    jest.mocked(confirmAsync).mockResolvedValueOnce(false);
    const port = await choosePortAsync('/me', { defaultPort: 8081, reuseExistingPort: true });
    expect(port).toBe(null);
    expect(confirmAsync).not.toBeCalled();
  });
});
