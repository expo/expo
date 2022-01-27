import openBrowserAsync from 'better-opn';

import { CI } from '../utils/env';
import { CommandError } from '../utils/errors';
import { learnMore } from '../utils/link';
import { ora } from '../utils/ora';

export async function registerAsync() {
  if (CI) {
    throw new CommandError(
      'NON_INTERACTIVE',
      `Cannot register an account in CI. Use the EXPO_TOKEN environment variable to authenticate in CI (${learnMore(
        'https://docs.expo.dev/accounts/programmatic-access/'
      )})`
    );
  }

  const registrationUrl = `https://expo.dev/signup`;

  const spinner = ora(`Opening ${registrationUrl}`).start();
  try {
    const opened = openBrowserAsync(registrationUrl);

    if (opened) {
      spinner.succeed(`Opened ${registrationUrl}`);
    }
    return;
  } catch (error) {
    spinner.fail(`Unable to open a web browser. Register an account at: ${registrationUrl}`);
    throw error;
  }
}
