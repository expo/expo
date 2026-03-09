import ora, { type Ora } from 'ora';

import { WithSpinnerParams } from './types';

export const withSpinner = async <T>({
  operation,
  loaderMessage,
  successMessage,
  errorMessage,
  onError = 'error',
  verbose = false,
}: WithSpinnerParams<T>) => {
  let spinner: Ora | undefined;

  try {
    if (!verbose) {
      spinner = ora(loaderMessage).start();
    }

    const result = await operation();

    if (!verbose) {
      spinner?.succeed(successMessage);
    }

    return result;
  } catch (error) {
    if (!verbose) {
      onError === 'error' ? spinner?.fail(errorMessage) : spinner?.warn(errorMessage);
    }

    throw new Error(errorMessage);
  } finally {
    if (!verbose && spinner?.isSpinning) {
      spinner?.stop();
    }
  }
};
