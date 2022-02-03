'use strict';

import { Asset } from 'expo-asset';

export const name = 'Asset';

export async function test(t) {
  t.describe(name, () => {
    [
      {
        module: require('../assets/black-128x256.png'),
        name: 'black-128x256',
        type: 'png',
        width: 128,
        height: 256,
      },
      {
        module: require('../assets/comic.ttf'),
        name: 'comic',
        type: 'ttf',
      },
    ].forEach(({ module, name, type, ...more }) =>
      t.describe(`${name}.${type}`, () => {
        t.it(`has correct name, type, ${Object.keys(more).join(', ')}`, async () => {
          const asset = Asset.fromModule(module);
          await asset.downloadAsync();
          t.expect(asset.name).toMatch(new RegExp(`${name}.*\.${type}`));
          t.expect(asset.type).toBe(type);
          console.log(asset);
          Object.keys(more).forEach((member) => t.expect(asset[member]).toBe(more[member]));
        });

        t.it("when downloaded, has a 'file://' localUri", async () => {
          const asset = Asset.fromModule(module);
          await asset.downloadAsync();
          t.expect(asset.localUri).toMatch(new RegExp(`.*\.${type}`));
        });
      })
    );
  });
}
