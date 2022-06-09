import { copyAsync } from '../../utils/dir';
import { saveAssetsAsync } from '../saveAssets';

jest.mock('../../log');

jest.mock('../../utils/dir', () => ({
  copyAsync: jest.fn(),
}));

describe(saveAssetsAsync, () => {
  it(`copy assets into directory`, async () => {
    await saveAssetsAsync('/', {
      outputDir: 'output',
      assets: [
        {
          __packager_asset: true,
          files: ['/icon.png', '/icon@2x.png'],
          hash: '4e3f888fc8475f69fd5fa32f1ad5216a',
          name: 'icon',
          type: 'png',
          fileHashes: ['4e3f888fc8475f69fd5fa32f1ad5216a', 'hash-2'],
        },
      ],
    });

    expect(copyAsync).toBeCalledTimes(2);
    expect(copyAsync).toHaveBeenNthCalledWith(
      1,
      '/icon.png',
      'output/assets/4e3f888fc8475f69fd5fa32f1ad5216a'
    );
    expect(copyAsync).toHaveBeenNthCalledWith(2, '/icon@2x.png', 'output/assets/hash-2');
  });
});
