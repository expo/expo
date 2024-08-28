import { Log } from '../../../log';
import { checkPackagesCompatibility } from '../checkPackagesCompatibility';

jest.mock('../../../log');

describe(checkPackagesCompatibility, () => {
  it(`Check the New Architecture compatibility`, async () => {
    await checkPackagesCompatibility(['react-native-code-push']);

    expect(Log.warn).toBeCalledTimes(1);
    expect(Log.warn).toHaveBeenLastCalledWith(
      expect.stringMatching(/"react-native-code-push" does not support New Architecture/)
    );
  });
});
