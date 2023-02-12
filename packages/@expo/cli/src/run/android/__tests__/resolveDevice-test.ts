import { Log } from '../../../log';
import { AndroidDeviceManager } from '../../../start/platforms/android/AndroidDeviceManager';
import { resolveDeviceAsync } from '../resolveDevice';

jest.mock('../../../log');
jest.mock('../../../start/platforms/android/AndroidDeviceManager', () => ({
  AndroidDeviceManager: {
    resolveAsync: jest.fn(async () => ({ device: { name: 'mock', pid: '123' } })),
    resolveFromNameAsync: jest.fn(async () => ({ device: { name: 'mock', pid: '123' } })),
  },
}));

describe(resolveDeviceAsync, () => {
  it(`resolves default device`, async () => {
    await resolveDeviceAsync();
    expect(Log.log).not.toBeCalled();
    expect(AndroidDeviceManager.resolveAsync).toBeCalledWith();
  });
  it(`prompts for device`, async () => {
    await resolveDeviceAsync(true);
    expect(Log.log).toBeCalledWith(expect.stringContaining('› Using --device mock'));
    expect(AndroidDeviceManager.resolveAsync).toBeCalledWith({ shouldPrompt: true });
  });
  it(`queries device`, async () => {
    await resolveDeviceAsync('search');
    expect(Log.log).toBeCalledWith(expect.stringContaining('› Using --device mock'));
    expect(AndroidDeviceManager.resolveFromNameAsync).toBeCalledWith('search');
  });
});
