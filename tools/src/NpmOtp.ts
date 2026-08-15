import inquirer from 'inquirer';

import logger from './Logger';

/**
 * Returns true if the error is an npm OTP failure (expired/invalid/missing code).
 *
 * `OTP required for authentication` is the message of `HttpErrorAuthOTP` in
 * `npm-registry-fetch`. Match it too, because `npm owner rm` rewraps the error
 * with its own `EOWNERMUTATE` code and keeps only the message, so the `EOTP`
 * code never reaches stderr.
 */
export function isOtpError(error: unknown): boolean {
  const message = String((error as any)?.stderr ?? (error as any)?.message ?? '');
  return /EOTP|one-time pass|OTP required/i.test(message);
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
 * succeeds or a non-OTP error is thrown. The prompt is injectable for tests.
 */
export async function withOtpRetry(
  fn: () => Promise<void>,
  promptForOtp: () => Promise<string> = promptOtp
): Promise<void> {
  while (true) {
    try {
      await fn();
      return;
    } catch (error) {
      if (!isOtpError(error)) {
        throw error;
      }
      // Distinguish the first code from a refresh, otherwise the warning claims
      // a code expired when none was ever provided.
      logger.warn(
        process.env.NPM_OTP
          ? '    ⚠️  OTP expired or invalid, requesting a new code...'
          : '    ⚠️  This operation requires a one-time password...'
      );
      process.env.NPM_OTP = await promptForOtp();
    }
  }
}
