import nock from 'nock';

import * as Log from '../../../log';
import { promptAsync, selectAsync } from '../../../utils/prompts';
import { getExpoApiBaseUrl } from '../../endpoint';
import { retryUsernamePasswordAuthWithOTPAsync, UserSecondFactorDeviceMethod } from '../otp';
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
  it('shows SMS OTP prompt when SMS is primary and code was automatically sent', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ otp: 'hello' }))
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

    expect(loginAsync).toHaveBeenCalledTimes(1);
  });

  it('shows authenticator OTP prompt when authenticator is primary', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ otp: 'hello' }))
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
    expect(loginAsync).toHaveBeenCalledTimes(1);
  });

  it('shows menu when user bails on primary', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ otp: null }))
      .mockImplementationOnce(async () => ({ otp: 'hello' })) // second time it is prompted after selecting backup code
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    jest
      .mocked(selectAsync)
      .mockImplementationOnce(async () => -1)
      .mockImplementation(async () => {
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

    expect(selectAsync).toHaveBeenCalledTimes(1);
    expect(loginAsync).toHaveBeenCalledTimes(1);
  });

  it('shows a warning when when user bails on primary and does not have any secondary set up', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ otp: null }))
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
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ otp: null }))
      .mockImplementationOnce(async () => ({ otp: 'hello' })) // second time it is prompted after selecting backup code
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    jest
      .mocked(selectAsync)
      .mockImplementationOnce(async () => -1)
      .mockImplementation(async () => {
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

    expect(promptAsync).toHaveBeenCalledTimes(2); // first OTP, second OTP
  });

  it('requests SMS OTP and prompts for SMS OTP when user selects SMS secondary', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ otp: null }))
      .mockImplementationOnce(async () => ({ otp: 'hello' })) // second time it is prompted after selecting backup code
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    jest
      .mocked(selectAsync)
      .mockImplementationOnce(async () => 0)
      .mockImplementation(async () => {
        throw new Error("shouldn't happen");
      });

    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/auth/send-sms-otp', {
        username: 'blah',
        password: 'blah',
        secondFactorDeviceID: 'p2',
      })
      .reply(200, {});

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

    expect(promptAsync).toHaveBeenCalledTimes(2); // first OTP, second OTP
    expect(scope.isDone()).toBe(true);
  });

  it('exits when user bails on primary and backup', async () => {
    jest
      .mocked(promptAsync)
      .mockImplementationOnce(async () => ({ otp: null }))
      .mockImplementation(() => {
        throw new Error("shouldn't happen");
      });

    jest
      .mocked(selectAsync)
      .mockImplementationOnce(async () => -2)
      .mockImplementation(async () => {
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
