import inquirer from 'inquirer';

import logger from './Logger';

/**
 * Returns true if the error is an npm OTP failure (expired/invalid/missing code).
 */
export function isOtpError(error: unknown): boolean {
  const message = String((error as any)?.stderr ?? (error as any)?.message ?? '');
  return /EOTP|one-time pass/i.test(message);
}

/**
 * Prompts the user to enter an npm OTP code.
 */
export async function promptOtp(): Promise<string> {
  const { otp } = await inquirer.prompt([
    {
      type: 'input',
      name: 'otp',
      message: 'Enter npm OTP code:',
    },
  ]);
  return otp.trim();
}

/**
 * Runs an async function, re-prompting for a fresh OTP whenever the attempt
 * fails due to an expired/invalid OTP code. Keeps retrying until the call
 * succeeds or a non-OTP error is thrown.
 */
export async function withOtpRetry(fn: () => Promise<void>): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await fn();
      return;
    } catch (error) {
      if (isOtpError(error)) {
        logger.warn('    ⚠️  OTP expired or invalid, requesting a new code...');
        process.env.NPM_OTP = await promptOtp();
      } else {
        throw error;
      }
    }
  }
}
