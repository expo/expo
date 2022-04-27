import { vol } from 'memfs';

import { promptToClearMalformedNativeProjectsAsync } from '../../prebuild/clearNativeFolder';
import { prebuildAsync } from '../../prebuild/prebuildAsync';
import { ensureNativeProjectAsync } from '../ensureNativeProject';

jest.mock('../../prebuild/prebuildAsync', () => ({
  prebuildAsync: jest.fn(),
}));

jest.mock('../../prebuild/clearNativeFolder', () => ({
  promptToClearMalformedNativeProjectsAsync: jest.fn(),
}));

describe(ensureNativeProjectAsync, () => {
  afterEach(() => vol.reset());

  it(`clears malformed project and regenerates`, async () => {
    vol.fromJSON({}, '/');
    await ensureNativeProjectAsync('/', { platform: 'android', install: true });
    expect(promptToClearMalformedNativeProjectsAsync).toHaveBeenCalledWith('/', ['android']);
    expect(prebuildAsync).toHaveBeenCalledWith('/', { install: true, platforms: ['android'] });
  });
});
