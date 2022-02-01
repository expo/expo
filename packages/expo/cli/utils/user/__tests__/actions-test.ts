import { ApiV2Error } from '../../api';
import { promptAsync } from '../../prompts';
import { showLoginPromptAsync } from '../actions';
import { retryUsernamePasswordAuthWithOTPAsync, UserSecondFactorDeviceMethod } from '../otp';
import { loginAsync } from '../user';

jest.mock('../../prompts');
jest.mock('../../api', () => {
  const { ApiV2Error } = jest.requireActual('../../api');
  return {
    ApiV2Error,
  };
});
jest.mock('../otp');
jest.mock('../user');

const asMock = (fn: any): jest.Mock => fn as jest.Mock;

beforeEach(() => {
  asMock(promptAsync).mockReset();
  asMock(promptAsync).mockImplementation(() => {
    throw new Error('Should not be called');
  });

  asMock(loginAsync).mockReset();
});

describe(showLoginPromptAsync, () => {
  it('prompts for OTP when 2FA is enabled', async () => {
    asMock(promptAsync)
      .mockImplementationOnce(() => ({ username: 'hello', password: 'world' }))
      .mockImplementationOnce(() => ({ otp: '123456' }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });
    asMock(loginAsync)
      .mockImplementationOnce(async () => {
        throw new ApiV2Error({ code: 'testcode', request: {} } as any, {
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
      .mockImplementation(() => {});

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
    asMock(promptAsync).mockImplementation(() => {
      throw new Error("shouldn't happen");
    });
    asMock(loginAsync).mockImplementation(() => {});

    await showLoginPromptAsync({ username: 'hello', password: 'world' });
  });
});
