import * as Updates from '../Updates';

it(`doesn't throw when reloadAsync is called in production`, async () => {
  const old__DEV__ = __DEV__;
  //@ts-ignore
  __DEV__ = false;

  await Updates.reloadAsync();

  //@ts-ignore
  __DEV__ = old__DEV__;
});
