import { vol } from 'memfs';

import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { resolveLaunchPropsAsync } from '../resolveLaunchProps';

describe(resolveLaunchPropsAsync, () => {
  afterEach(() => vol.reset());

  it(`asserts no android folder`, async () => {
    vol.fromJSON({}, '/');
    await expect(resolveLaunchPropsAsync('/')).rejects.toThrow(
      /Android project folder is missing in project/
    );
  });
  it(`resolves launch properties`, async () => {
    vol.fromJSON(rnFixture, '/');
    expect(await resolveLaunchPropsAsync('/')).toEqual({
      launchActivity: 'com.bacon.mydevicefamilyproject/.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
    });
  });
});
