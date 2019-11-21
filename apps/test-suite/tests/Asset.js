'use strict';

import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export const name = 'Asset';

export function test({ describe, afterEach, it, expect, jasmine, ...t }) {
  describe(name, () => {
    [
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
    ].forEach(({ module, name, type, ...more }) =>
      describe(`${name}.${type}`, () => {
        it(`has correct name, type, ${Object.keys(more).join(', ')}`, async () => {
          const asset = Asset.fromModule(module);
          expect(asset.name).toBe(name);
          expect(asset.type).toBe(type);
          Object.keys(more).forEach(member => expect(asset[member]).toBe(more[member]));
        });

        it("when downloaded, has a 'file://' localUri", async () => {
          const asset = Asset.fromModule(module);
          await asset.downloadAsync();
          expect(asset.localUri).toMatch(new RegExp(`^file:\/\/.*\.${type}`));
        });

        it(
          'when downloaded, exists in cache with matching hash and has ' +
            'localUri pointing to the cached file',
          async () => {
            const asset = Asset.fromModule(module);
            await asset.downloadAsync();

            const { exists, md5, uri: cacheUri } = await FileSystem.getInfoAsync(asset.localUri, {
              cache: true,
              md5: true,
            });

            expect(exists).toBeTruthy();
            expect(md5).toBe(asset.hash);
            expect(cacheUri).toBe(asset.localUri);
          }
        );
      })
    );
  });
}
