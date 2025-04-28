import * as Updates from '../Updates';

// __DEV__ is usually not assignable, but we need to set it to false for this test
it(`doesn't throw when reloadAsync is called in production`, async () => {
  const old__DEV__ = __DEV__;
  // eslint-disable-next-line no-global-assign
  __DEV__ = false;

  await Updates.reloadAsync();

  // eslint-disable-next-line no-global-assign
  __DEV__ = old__DEV__;
});
