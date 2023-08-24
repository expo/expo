import { env } from '../utils/env';
import { CommandError } from '../utils/errors';
import { isInteractive } from '../utils/interactive';
import { learnMore } from '../utils/link';
import { openBrowserAsync } from '../utils/open';
import { ora } from '../utils/ora';

export async function registerAsync() {
  if (!isInteractive()) {
    throw new CommandError(
      'NON_INTERACTIVE',
      `Cannot register an account in CI. Use the EXPO_TOKEN environment variable to authenticate in CI (${learnMore(
        'https://docs.expo.dev/accounts/programmatic-access/'
      )})`
    );
  } else if (env.EXPO_OFFLINE) {
    throw new CommandError('OFFLINE', `Cannot register an account in offline-mode`);
  }

  const registrationUrl = `https://expo.dev/signup`;
  const failedMessage = `Unable to open a web browser. Register an account at: ${registrationUrl}`;
  const spinner = ora(`Opening ${registrationUrl}`).start();
  try {
    const opened = await openBrowserAsync(registrationUrl);

    if (opened) {
      spinner.succeed(`Opened ${registrationUrl}`);
    } else {
      spinner.fail(failedMessage);
    }
  } catch (error) {
    spinner.fail(failedMessage);
    throw error;
  }
}
