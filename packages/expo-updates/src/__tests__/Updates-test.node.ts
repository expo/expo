import * as Updates from '../Updates';

it(`doesn't throw when reloadAsync is called in production`, async () => {
  const old__DEV__ = __DEV__;
  //@ts-expect-error: __DEV__ is usually not assignable but we need to set it to false for this test
  __DEV__ = false;

  await Updates.reloadAsync();

  //@ts-expect-error: __DEV__ is usually not assignable but we need to set it to false for this test
  __DEV__ = old__DEV__;
});
