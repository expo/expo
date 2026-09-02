import * as Log from '../../../log';
import { promptAsync, selectAsync } from '../../../utils/prompts';
import { retryUsernamePasswordAuthWithOTPAsync } from '../otp';
import { loginAsync } from '../user';

jest.mock('../../../utils/prompts');
jest.mock('../user');
jest.mock('../../../log');

beforeEach(() => {
  jest.mocked(promptAsync).mockImplementation(() => {
    throw new Error('Should not be called');
  });

  jest.mocked(selectAsync).mockClear();
  jest.mocked(selectAsync).mockImplementation(() => {
    throw new Error('Should not be called');
  });
});

describe(retryUsernamePasswordAuthWithOTPAsync, () => {
  it('shows authenticator OTP prompt', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ otp: 'hello' }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await retryUsernamePasswordAuthWithOTPAsync('blah', 'blah');

    expect(Log.log).toHaveBeenCalledWith('One-time password from authenticator required.');
    expect(loginAsync).toHaveBeenCalledTimes(1);
  });

  it('exits when user bails on OTP/backup', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ otp: null }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await expect(retryUsernamePasswordAuthWithOTPAsync('blah', 'blah')).rejects.toThrow(
      'Interactive prompt was cancelled.'
    );
  });
});
