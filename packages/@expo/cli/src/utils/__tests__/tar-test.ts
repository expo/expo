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

describe(extractAsync, () => {
  beforeEach(() => {
    vol.fromJSON({ 'template.tgz': '' }, '.');
    jest.mocked(spawnAsync).mockClear();
    jest.mocked(untar).mockClear();
    jest.mocked(Log.warn).mockClear();
  });

  it('calls utility to extract tarball', async () => {
    await extractAsync('./template.tgz', './output');
    // No native tools or warnings.
    expect(spawnAsync).toHaveBeenCalledTimes(0);
    expect(Log.warn).toHaveBeenCalledTimes(0);
    // JS tools
    expect(untar).toHaveBeenCalledTimes(1);
  });
});
