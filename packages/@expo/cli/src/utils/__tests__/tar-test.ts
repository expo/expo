import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';
import { untar } from 'multitars';

import * as Log from '../../log';
import { extractAsync } from '../tar';

jest.mock(`../../log`);

jest.mock('multitars', () => ({
  ...jest.requireActual('multitars'),
  untar: jest.fn(() => []),
}));

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', {
    value,
  });
}

describe(extractAsync, () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vol.fromJSON({ 'template.tgz': '' }, '.');
    jest.mocked(spawnAsync).mockClear();
    jest.mocked(untar).mockClear();
    jest.mocked(Log.warn).mockClear();
  });

  afterAll(() => {
    mockPlatform(originalPlatform);
  });

  it('extracts a tar file using node module when native fails', async () => {
    // set to mac in order to test native tools.
    mockPlatform('darwin');
    jest.mocked(spawnAsync).mockImplementationOnce(() => {
      throw new Error('mock failure');
    });

    await extractAsync('./template.tgz', './output');

    // Expect a warning that surfaces the native error message.
    expect(Log.warn).toHaveBeenCalledTimes(1);
    expect(Log.warn).toHaveBeenLastCalledWith(
      expect.stringMatching(/Failed to extract tar.*mock failure/)
    );
    // JS tools
    expect(untar).toHaveBeenCalledTimes(1);
  });

  it('skips JS tools on mac when native tools work', async () => {
    // set to mac in order to test native tools.
    mockPlatform('darwin');

    await extractAsync('./template.tgz', './output');

    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(Log.warn).toHaveBeenCalledTimes(0);
    expect(untar).toHaveBeenCalledTimes(0);
  });

  it('skips native tools on windows', async () => {
    mockPlatform('win32');

    await extractAsync('./template.tgz', './output');

    // No native tools or warnings.
    expect(spawnAsync).toHaveBeenCalledTimes(0);
    expect(Log.warn).toHaveBeenCalledTimes(0);
    // JS tools
    expect(untar).toHaveBeenCalledTimes(1);
  });
});
