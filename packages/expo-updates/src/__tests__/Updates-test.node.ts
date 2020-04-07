import * as Updates from '../Updates';

it(`doesn't throw when reloadAsync is called`, async () => {
  await Updates.reloadAsync();
});
