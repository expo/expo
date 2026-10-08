import { Log } from '../../log';
import { copyAsync, removeAsync } from '../../utils/dir';
import { copyBinaryToOutputAsync } from '../copyBinaryToOutputAsync';

jest.mock('../../log');
jest.mock('../../utils/dir');

describe(copyBinaryToOutputAsync, () => {
  it(`replaces the app in the output directory`, async () => {
    await expect(copyBinaryToOutputAsync('/DerivedData/app.app', '/app/build')).resolves.toBe(
      '/app/build/app.app'
    );
    expect(removeAsync).toHaveBeenCalledWith('/app/build/app.app');
    expect(jest.mocked(removeAsync).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(copyAsync).mock.invocationCallOrder[0]!
    );
    expect(copyAsync).toHaveBeenCalledWith('/DerivedData/app.app', '/app/build/app.app');
    expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Copied to /app/build/app.app'));
  });
});
