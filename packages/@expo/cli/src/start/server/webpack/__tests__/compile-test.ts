import { Log } from '../../../../log';
import { compileAsync } from '../compile';

jest.mock('../../../../log');

describe(compileAsync, () => {
  it(`compiles successfully`, async () => {
    await compileAsync({
      run: jest.fn(async (callback) => {
        callback(null, {
          toJson() {
            return {
              warnings: [],
              errors: [],
            };
          },
        });
      }),
    } as any);

    expect(Log.warn).not.toBeCalled();
  });
});
