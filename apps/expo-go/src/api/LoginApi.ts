import { APIV2Client } from './APIV2Client';
import { ApiError } from './ApiError';

export type SecondFactorDevice = {
  id: string;
  method: string;
  sms_phone_number: string | null;
  is_primary: boolean;
};

export type LoginOtpMetadata = {
  secondFactorDevices: SecondFactorDevice[];
  smsAutomaticallySent: boolean;
};

export const OTP_REQUIRED_CODE = 'ONE_TIME_PASSWORD_REQUIRED';
export const AUTHENTICATION_ERROR_CODE = 'AUTHENTICATION_ERROR';

export function isOtpRequired(error: unknown): error is ApiError & { metadata: LoginOtpMetadata } {
  return error instanceof ApiError && error.code === OTP_REQUIRED_CODE;
}

export function isAuthenticationError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === AUTHENTICATION_ERROR_CODE;
}

async function loginAsync(credentials: {
  username: string;
  password: string;
  otp?: string;
}): Promise<{ sessionSecret: string }> {
  const api = new APIV2Client();
  return await api.sendUnauthenticatedApiV2Request<{ sessionSecret: string }>('auth/loginAsync', {
    method: 'POST',
    body: credentials,
  });
}

export default {
  loginAsync,
};
