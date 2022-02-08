import * as Log from '../../../log';
import { apiClient } from '../../api';
import { promptAsync, selectAsync } from '../../prompts';
import { retryUsernamePasswordAuthWithOTPAsync, UserSecondFactorDeviceMethod } from '../otp';
import { loginAsync } from '../user';

jest.mock('../../prompts');
jest.mock('../../api');
jest.mock('../user');
jest.mock('../../../log');

const asMock = (fn: any): jest.Mock => fn as jest.Mock;

beforeEach(() => {
  asMock(promptAsync).mockReset();
  asMock(promptAsync).mockImplementation(() => {
    throw new Error('Should not be called');
  });

  asMock(selectAsync).mockReset();
  asMock(selectAsync).mockImplementation(() => {
    throw new Error('Should not be called');
  });

  asMock(loginAsync).mockReset();
  asMock(Log.log).mockReset();
});

describe(retryUsernamePasswordAuthWithOTPAsync, () => {
  it('shows SMS OTP prompt when SMS is primary and code was automatically sent', async () => {
    asMock(promptAsync)
      .mockImplementationOnce(() => ({ otp: 'hello' }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await retryUsernamePasswordAuthWithOTPAsync('blah', 'blah', {
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

    expect(Log.log).toHaveBeenCalledWith(
      'One-time password was sent to the phone number ending in testphone.'
    );

    expect(asMock(loginAsync)).toHaveBeenCalledTimes(1);
  });

  it('shows authenticator OTP prompt when authenticator is primary', async () => {
    asMock(promptAsync)
      .mockImplementationOnce(() => ({ otp: 'hello' }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await retryUsernamePasswordAuthWithOTPAsync('blah', 'blah', {
      secondFactorDevices: [
        {
          id: 'p0',
          is_primary: true,
          method: UserSecondFactorDeviceMethod.AUTHENTICATOR,
          sms_phone_number: null,
        },
      ],
      smsAutomaticallySent: false,
    });

    expect(Log.log).toHaveBeenCalledWith('One-time password from authenticator required.');
    expect(asMock(loginAsync)).toHaveBeenCalledTimes(1);
  });

  it('shows menu when user bails on primary', async () => {
    asMock(promptAsync)
      .mockImplementationOnce(() => ({ otp: null }))
      .mockImplementationOnce(() => ({ otp: 'hello' })) // second time it is prompted after selecting backup code
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    asMock(selectAsync)
      .mockImplementationOnce(() => -1)
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await retryUsernamePasswordAuthWithOTPAsync('blah', 'blah', {
      secondFactorDevices: [
        {
          id: 'p0',
          is_primary: true,
          method: UserSecondFactorDeviceMethod.AUTHENTICATOR,
          sms_phone_number: null,
        },
        {
          id: 'p2',
          is_primary: false,
          method: UserSecondFactorDeviceMethod.AUTHENTICATOR,
          sms_phone_number: null,
        },
      ],
      smsAutomaticallySent: false,
    });

    expect(asMock(selectAsync).mock.calls.length).toEqual(1);
    expect(asMock(loginAsync)).toHaveBeenCalledTimes(1);
  });

  it('shows a warning when when user bails on primary and does not have any secondary set up', async () => {
    asMock(promptAsync)
      .mockImplementationOnce(() => ({ otp: null }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await expect(
      retryUsernamePasswordAuthWithOTPAsync('blah', 'blah', {
        secondFactorDevices: [
          {
            id: 'p0',
            is_primary: true,
            method: UserSecondFactorDeviceMethod.AUTHENTICATOR,
            sms_phone_number: null,
          },
        ],
        smsAutomaticallySent: false,
      })
    ).rejects.toThrowError(
      'No other second-factor devices set up. Ensure you have set up and certified a backup device.'
    );
  });

  it('prompts for authenticator OTP when user selects authenticator secondary', async () => {
    asMock(promptAsync)
      .mockImplementationOnce(() => ({ otp: null }))
      .mockImplementationOnce(() => ({ otp: 'hello' })) // second time it is prompted after selecting backup code
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    asMock(selectAsync)
      .mockImplementationOnce(() => -1)
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await retryUsernamePasswordAuthWithOTPAsync('blah', 'blah', {
      secondFactorDevices: [
        {
          id: 'p0',
          is_primary: true,
          method: UserSecondFactorDeviceMethod.AUTHENTICATOR,
          sms_phone_number: null,
        },
        {
          id: 'p2',
          is_primary: false,
          method: UserSecondFactorDeviceMethod.AUTHENTICATOR,
          sms_phone_number: null,
        },
      ],
      smsAutomaticallySent: false,
    });

    expect(asMock(promptAsync).mock.calls.length).toBe(2); // first OTP, second OTP
  });

  it('requests SMS OTP and prompts for SMS OTP when user selects SMS secondary', async () => {
    asMock(promptAsync)
      .mockImplementationOnce(() => ({ otp: null }))
      .mockImplementationOnce(() => ({ otp: 'hello' })) // second time it is prompted after selecting backup code
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    asMock(selectAsync)
      .mockImplementationOnce(() => 0)
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    asMock(apiClient.post).mockReturnValueOnce({
      json: () => Promise.resolve({ data: { sessionSecret: 'SESSION_SECRET' } }),
    });

    await retryUsernamePasswordAuthWithOTPAsync('blah', 'blah', {
      secondFactorDevices: [
        {
          id: 'p0',
          is_primary: true,
          method: UserSecondFactorDeviceMethod.AUTHENTICATOR,
          sms_phone_number: null,
        },
        {
          id: 'p2',
          is_primary: false,
          method: UserSecondFactorDeviceMethod.SMS,
          sms_phone_number: 'wat',
        },
      ],
      smsAutomaticallySent: false,
    });

    expect(asMock(promptAsync).mock.calls.length).toBe(2); // first OTP, second OTP
    expect(asMock(apiClient.post).mock.calls[0]).toEqual([
      'auth/send-sms-otp',
      {
        json: {
          username: 'blah',
          password: 'blah',
          secondFactorDeviceID: 'p2',
        },
      },
    ]);
  });

  it('exits when user bails on primary and backup', async () => {
    asMock(promptAsync)
      .mockImplementationOnce(() => ({ otp: null }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    asMock(selectAsync)
      .mockImplementationOnce(() => -2)
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    await expect(
      retryUsernamePasswordAuthWithOTPAsync('blah', 'blah', {
        secondFactorDevices: [
          {
            id: 'p0',
            is_primary: true,
            method: UserSecondFactorDeviceMethod.AUTHENTICATOR,
            sms_phone_number: null,
          },
          {
            id: 'p2',
            is_primary: false,
            method: UserSecondFactorDeviceMethod.AUTHENTICATOR,
            sms_phone_number: null,
          },
        ],
        smsAutomaticallySent: false,
      })
    ).rejects.toThrowError('Interactive prompt was cancelled.');
  });
});
