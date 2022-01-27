import openBrowserAsync from 'better-opn';

import { CI } from '../utils/env';
import { CommandError } from '../utils/errors';
import { ora } from '../utils/ora';

export async function registerAsync() {
  const REGISTRATION_URL = `https://expo.dev/signup`;
  if (CI) {
    throw new CommandError(
      'NON_INTERACTIVE',
      `Cannot register an account in CI. Register an account at: ${REGISTRATION_URL}`
    );
  }

  const spinner = ora(`Opening ${REGISTRATION_URL}`).start();
  try {
    const opened = openBrowserAsync(REGISTRATION_URL);

    if (opened) {
      spinner.succeed(`Opened ${REGISTRATION_URL}`);
    }
    return;
  } catch (error) {
    spinner.fail(`Unable to open a web browser. Register an account at: ${REGISTRATION_URL}`);
    throw error;
  }
}
