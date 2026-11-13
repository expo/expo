import { vol } from 'memfs';

import { copyAsync, removeAsync } from '../../utils/dir';
import { copyBinaryToOutputAsync } from '../copyBinaryToOutputAsync';

jest.mock('../../log');
jest.mock('../../utils/dir', () => ({
  ...jest.requireActual('../../utils/dir'),
  copyAsync: jest.fn(),
  removeAsync: jest.fn(),
}));

afterEach(() => vol.reset());

it('does not remove the binary when the output directory links to its folder', async () => {
  const apkDirectory = '/app/android/app/build/outputs/apk/debug';
  vol.fromJSON({ [`${apkDirectory}/app-debug.apk`]: '' });
  vol.symlinkSync(apkDirectory, '/app/build');

  await copyBinaryToOutputAsync(`${apkDirectory}/app-debug.apk`, '/app/build');

  expect(removeAsync).not.toHaveBeenCalled();
  expect(copyAsync).not.toHaveBeenCalled();
});
