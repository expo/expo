import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import invariant from 'invariant';

export const name = 'Asset';

export function test(t: any) {
  t.describe('Asset', () => {
    const testAssets = [
      {
        module: require('../assets/black-128x256.png'),
        name: 'black-128x256',
        type: 'png',
        hash: '4e3911b395b3cc00e737be94c7ed49bb',
        width: 128,
        height: 256,
      },
      {
        module: require('../assets/comic.ttf'),
        name: 'comic',
        type: 'ttf',
        hash: '69d77ab5cba970d7934a5f5bcd8fdd11',
      },
      {
        module: 'https://static.expo.dev/static/favicons/favicon-light-48x48.png',
        name: '',
        type: 'png',
        hash: null,
      },
    ] as const;

    t.it(
      'when having a local file asset, downloading it twice should reuse the local file',
      async () => {
        // set up a local file asset
        const asset = Asset.fromModule(testAssets[1].module);
        asset.downloaded = false;

        await asset.downloadAsync();

        const fileInfo = await FileSystem.getInfoAsync(asset.localUri);
        invariant(fileInfo.exists, 'File should exist');
        t.expect(fileInfo.size > 0).toBeTruthy();

        // create a new asset with the same localUri
        const anotherAsset = new Asset({
          name: asset.name + 'another',
          type: asset.type,
          hash: asset.hash,
          uri: asset.localUri,
        });
        anotherAsset.downloaded = false;
        await anotherAsset.downloadAsync();

        const fileInfo2 = await FileSystem.getInfoAsync(anotherAsset.localUri);
        invariant(fileInfo2.exists, 'File should exist');

        t.expect(fileInfo2.size).toBe(fileInfo.size);
        t.expect(anotherAsset.localUri).toBe(asset.localUri);
      }
    );

    testAssets.forEach(({ module, name, type, ...more }) =>
      t.describe(`${name}.${type}`, () => {
        t.it(`has correct name, type, ${Object.keys(more).join(', ')}`, async () => {
          const asset = Asset.fromModule(module);
          t.expect(asset.name).toBe(name);
          t.expect(asset.type).toBe(type);
          Object.keys(more).forEach((member: string) =>
            t.expect(asset[member as keyof typeof asset]).toBe(more[member as keyof typeof more])
          );
        });

        t.it("when downloaded, has a 'file://' localUri", async () => {
          const asset = Asset.fromModule(module);
          await asset.downloadAsync();
          t.expect(asset.localUri).toMatch(new RegExp(`^file:\/\/.*\.${type}`));
        });

        t.it(
          'when downloaded, exists in cache with matching hash and has ' +
            'localUri pointing to the cached file',
          async () => {
            const asset = Asset.fromModule(module);
            await asset.downloadAsync();

            const fileInfo = await FileSystem.getInfoAsync(asset.localUri, {
              md5: true,
            });
            invariant(fileInfo.exists, 'File should exist');

            const { md5, uri: cacheUri, size } = fileInfo;

            t.expect(size > 0).toBeTruthy();
            more['hash'] && t.expect(md5).toBe(asset.hash);
            t.expect(cacheUri).toBe(asset.localUri);
            await asset.downloadAsync();
            t.expect(asset.localUri).toBe(cacheUri);
          }
        );
      })
    );
  });
}
