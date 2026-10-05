import { freePortAsync } from '../../utils/freeport';
import { getRunningProcess } from '../../utils/getRunningProcess';
import { isInteractive } from '../../utils/interactive';
import { confirmAsync } from '../../utils/prompts';
import { resolveBundlerPropsAsync } from '../resolveBundlerProps';

jest.mock('../../log');
jest.mock('../../utils/prompts');
jest.mock('../../utils/freeport', () => ({
  testPortAsync: jest.fn(async () => true),
  freePortAsync: jest.fn(async (port) => port),
}));
jest.mock('../../utils/interactive', () => ({
  isInteractive: jest.fn(() => true),
}));
jest.mock('../../utils/getRunningProcess', () => ({
  getRunningProcess: jest.fn(() => null),
}));

function mockBusyPort(directory: string) {
  jest.mocked(freePortAsync).mockResolvedValueOnce(8082);
  jest.mocked(getRunningProcess).mockResolvedValueOnce({
    pid: 1,
    directory,
    command: 'npx expo',
  });
}

beforeEach(() => {
  delete process.env.RCT_METRO_PORT;
});

describe(resolveBundlerPropsAsync, () => {
  it(`starts the bundler on the next free port when the default port is busy without a TTY`, async () => {
    jest.mocked(isInteractive).mockReturnValue(false);
    mockBusyPort('/other/project');

    await expect(resolveBundlerPropsAsync('/me', {})).resolves.toEqual({
      port: 8082,
      shouldStartBundler: true,
    });
    expect(process.env.RCT_METRO_PORT).toBe('8082');
    expect(confirmAsync).not.toHaveBeenCalled();
  });

  it(`asserts when an explicit port is busy without a TTY`, async () => {
    jest.mocked(isInteractive).mockReturnValue(false);
    mockBusyPort('/other/project');

    await expect(resolveBundlerPropsAsync('/me', { port: 8081 })).rejects.toMatchObject({
      code: 'PORT_IN_USE',
    });
    expect(process.env.RCT_METRO_PORT).toBeUndefined();
  });

  it(`starts the bundler on the next free port when the prompt can't be shown`, async () => {
    jest.mocked(isInteractive).mockReturnValue(true);
    mockBusyPort('/other/project');
    jest
      .mocked(confirmAsync)
      .mockRejectedValueOnce(
        Object.assign(new Error('Input is required'), { code: 'NON_INTERACTIVE' })
      );

    await expect(resolveBundlerPropsAsync('/me', {})).resolves.toEqual({
      port: 8082,
      shouldStartBundler: true,
    });
    expect(process.env.RCT_METRO_PORT).toBe('8082');
  });

  it(`skips the bundler when this app already serves the busy port`, async () => {
    jest.mocked(isInteractive).mockReturnValue(false);
    mockBusyPort('/me');

    await expect(resolveBundlerPropsAsync('/me', {})).resolves.toEqual({
      port: 8081,
      shouldStartBundler: false,
    });
    expect(process.env.RCT_METRO_PORT).toBeUndefined();
  });

  it(`asserts instead of using the busy port when the user declines another port`, async () => {
    jest.mocked(isInteractive).mockReturnValue(true);
    mockBusyPort('/other/project');
    jest.mocked(confirmAsync).mockResolvedValueOnce(false);

    await expect(resolveBundlerPropsAsync('/me', {})).rejects.toMatchObject({
      code: 'PORT_IN_USE',
      message: expect.stringMatching(/Port 8081 is unavailable/),
    });
    expect(confirmAsync).toHaveBeenCalledWith({ initial: true, message: 'Use port 8082 instead?' });
  });
});
