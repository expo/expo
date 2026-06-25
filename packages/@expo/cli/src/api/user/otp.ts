import chalk from 'chalk';

import * as Log from '../../log';
import { AbortCommandError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import { promptAsync } from '../../utils/prompts';
import { loginAsync } from './user';

const nonInteractiveHelp = `Use the EXPO_TOKEN environment variable to authenticate in CI (${learnMore(
  'https://docs.expo.dev/accounts/programmatic-access/'
)})`;

/**
 * Prompt for an OTP with the option to cancel the question by answering empty (pressing return key).
 */
async function promptForOTPAsync(): Promise<string | null> {
  const enterMessage = chalk`press {bold Enter} to cancel`;
  const { otp } = await promptAsync(
    {
      type: 'text',
      name: 'otp',
      message: `One-time password or backup code (${enterMessage}):`,
    },
    { nonInteractiveHelp }
  );
  return otp || null;
}

/**
 * Handle the special case error indicating that a second-factor is required for authentication.
 */
export async function retryUsernamePasswordAuthWithOTPAsync(
  username: string,
  password: string
): Promise<void> {
  Log.log('One-time password from authenticator required.');
  const otp = await promptForOTPAsync();
  if (!otp) {
    throw new AbortCommandError();
  }

  await loginAsync({
    username,
    password,
    otp,
  });
}
