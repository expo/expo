import { Cache } from '../Cache';

jest.mock('@expo/rudder-sdk-node');

const fs = require('fs-extra');
const path = require('path');

describe(Cache, () => {
  it('works without a bootstrap file', async () => {
    const dateCache = new Cache({
      getAsync: () => new Date(),
      filename: 'dateslol',
      ttlMilliseconds: 1000,
    });

    try {
      await dateCache.clearAsync();
    } catch (e) {
      // this is ok
    }

    const date1 = new Date(await dateCache.getAsync());

    // should be well within the TTL, should be identical value
    expect(date1).toEqual(new Date(await dateCache.getAsync()));

    // should be outside of the TTL -- just making sure that sufficient delay will change the value
    setTimeout(() => {
      dateCache.getAsync().then((d) => {
        expect(date1).not.toEqual(new Date(d));
      });
    }, 3000);
  });

  xit('works with a bootstrap file', async () => {
    const expected = JSON.parse(await fs.readFile(path.join(__dirname, 'xdl/package.json')));

    const failCacher = new Cache({
      getAsync() {
        throw new Error('lol this never succeeds');
      },
      filename: 'bootstrap',
      ttlMilliseconds: 1000,
      bootstrapFile: path.join(__dirname, 'xdl/package.json'),
    });

    // since we don't mock the fs here (.cache is transient), need to make sure it's empty
    try {
      await failCacher.clearAsync();
    } catch (e) {
      // noop
    }

    const found = await failCacher.getAsync();

    expect(found).toEqual(expected);
  });
});
