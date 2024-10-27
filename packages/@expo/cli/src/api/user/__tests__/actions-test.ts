import { promptAsync } from '../../../utils/prompts';
import { ApiV2Error } from '../../rest/client';
import { showLoginPromptAsync } from '../actions';
import { retryUsernamePasswordAuthWithOTPAsync, UserSecondFactorDeviceMethod } from '../otp';
import { loginAsync, ssoLoginAsync } from '../user';

jest.mock('../../../log');
jest.mock('../../../utils/prompts');
jest.mock('../../rest/client', () => {
  const { ApiV2Error } = jest.requireActual('../../rest/client');
  return {
    ApiV2Error,
  };
});
jest.mock('../otp');
jest.mock('../user');

beforeEach(() => {
  jest.mocked(promptAsync).mockClear();
  jest.mocked(promptAsync).mockImplementation(() => {
    throw new Error('Should not be called');
  });

  jest.mocked(loginAsync).mockClear();
  jest.mocked(ssoLoginAsync).mockClear();
});

describe(showLoginPromptAsync, () => {
  it('prompts for OTP when 2FA is enabled', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ username: 'hello', password: 'world' }))
      .mockImplementationOnce(async () => ({ otp: '123456' }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });
    jest
      .mocked(loginAsync)
      .mockImplementationOnce(async () => {
        throw new ApiV2Error({
          message: 'An OTP is required',
          code: 'ONE_TIME_PASSWORD_REQUIRED',
          metadata: {
            secondFactorDevices: [
              {
                id: 'p0',
                is_primary: true,
                method: UserSecondFactorDeviceMethod.SMS,
                sms_phone_number: 'testphone',
              },
            ],
            smsAutomaticallySent: true,
          },
        });
      })
      .mockImplementation(async () => {});

    await showLoginPromptAsync();

    expect(retryUsernamePasswordAuthWithOTPAsync).toHaveBeenCalledWith('hello', 'world', {
      secondFactorDevices: [
        {
          id: 'p0',
          is_primary: true,
          method: UserSecondFactorDeviceMethod.SMS,
          sms_phone_number: 'testphone',
        },
      ],
      smsAutomaticallySent: true,
    });
  });

  it('does not prompt if all required credentials are provided', async () => {
    jest.mocked(promptAsync).mockImplementation(() => {
      throw new Error("shouldn't happen");
    });
    jest.mocked(loginAsync).mockImplementation(async () => {});

    await showLoginPromptAsync({ username: 'hello', password: 'world' });
  });

  it('calls regular login if the sso flag is false', async () => {
    jest.mocked(promptAsync).mockImplementationOnce(async () => ({
      username: 'USERNAME',
      password: 'PASSWORD',
    }));

    await showLoginPromptAsync({ username: 'hello', password: 'world', sso: false });

    expect(loginAsync).toHaveBeenCalledTimes(1);
  });

  it('calls regular login if the sso flag is undefined', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ username: 'USERNAME', password: 'PASSWORD' }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await showLoginPromptAsync({ username: 'hello', password: 'world' });

    expect(loginAsync).toHaveBeenCalledTimes(1);
  });

  it('calls SSO login if the sso flag is true', async () => {
    jest.mocked(promptAsync);
    await showLoginPromptAsync({ username: 'hello', password: 'world', sso: true });

    expect(ssoLoginAsync).toHaveBeenCalledTimes(1);
  });
});
