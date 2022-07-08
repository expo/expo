import { asMock } from '../../../__tests__/asMock';
import { promptAsync } from '../../../utils/prompts';
import { ApiV2Error } from '../../rest/client';
import { showLoginPromptAsync } from '../actions';
import { retryUsernamePasswordAuthWithOTPAsync, UserSecondFactorDeviceMethod } from '../otp';
import { loginAsync } from '../user';

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
  asMock(promptAsync).mockClear();
  asMock(promptAsync).mockImplementation(() => {
    throw new Error('Should not be called');
  });

  asMock(loginAsync).mockClear();
});

describe(showLoginPromptAsync, () => {
  it('prompts for OTP when 2FA is enabled', async () => {
    asMock(promptAsync)
      .mockImplementationOnce(async () => ({ username: 'hello', password: 'world' }))
      .mockImplementationOnce(async () => ({ otp: '123456' }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });
    asMock(loginAsync)
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
    asMock(promptAsync).mockImplementation(() => {
      throw new Error("shouldn't happen");
    });
    asMock(loginAsync).mockImplementation(async () => {});

    await showLoginPromptAsync({ username: 'hello', password: 'world' });
  });
});
