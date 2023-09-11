import ora, { Ora } from 'ora';

import { env } from './env';

export function withSectionLog<T>(
  action: (spinner: Ora) => Promise<T>,
  message: {
    pending: string;
    success: string;
    error: (errror: Error) => string;
  }
) {
  const disabled = env.CI || env.EXPO_DEBUG;
  const spinner = ora({
    text: message.pending,
    // Ensure our non-interactive mode emulates CI mode.
    isEnabled: !disabled,
    // In non-interactive mode, send the stream to stdout so it prevents looking like an error.
    stream: disabled ? process.stdout : process.stderr,
  });

  spinner.start();

  return action(spinner).then(
    result => {
      spinner.succeed(message.success);
      return result;
    },
    error => {
      spinner.fail(message.error(error));
      throw error;
    }
  );
}
