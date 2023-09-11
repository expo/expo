import ora from 'ora';

import { env } from '../env';
import { withSectionLog } from '../log';

jest.mock('ora');

describe(withSectionLog, () => {
  it('it disables the spinner when in CI mode', async () => {
    jest.spyOn(env, 'CI', 'get').mockReturnValue(true);

    await withSectionLog(() => Promise.resolve(), {
      pending: 'pending',
      success: 'success',
      error: () => 'error',
    });

    expect(ora).toHaveBeenCalledWith(
      expect.objectContaining({
        isEnabled: false,
      })
    );
  });

  it('it uses stdout when in CI mode', async () => {
    jest.spyOn(env, 'CI', 'get').mockReturnValue(true);

    await withSectionLog(() => Promise.resolve(), {
      pending: 'pending',
      success: 'success',
      error: () => 'error',
    });

    expect(ora).toHaveBeenCalledWith(
      expect.objectContaining({
        stream: process.stdout,
      })
    );
  });

  it('it returns the result of the action', async () => {
    const result = await withSectionLog(() => Promise.resolve('hello world'), {
      pending: 'pending',
      success: 'success',
      error: () => 'error',
    });

    expect(result).toBe('hello world');
  });

  it('it sets pending message', async () => {
    await withSectionLog(() => Promise.resolve(), {
      pending: 'pending',
      success: 'success',
      error: () => 'error',
    });

    expect(ora).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'pending',
      })
    );
  });

  it('it sets success message', async () => {
    const spinner = await withSectionLog(ora => Promise.resolve(ora), {
      pending: 'pending',
      success: 'success',
      error: () => 'error',
    });

    expect(spinner.succeed).toHaveBeenCalledWith('success');
  });

  it('it throws the encountered error', async () => {
    const error = new Error('error');

    try {
      await withSectionLog(() => Promise.reject(error), {
        pending: 'pending',
        success: 'success',
        error: () => 'error',
      });
      expect(true).toBe('Should not be reached');
    } catch (thrown) {
      expect(thrown).toBe(error);
    }
  });

  it('it sets error message', async () => {
    const spinner = await withSectionLog(ora => Promise.reject(ora), {
      pending: 'pending',
      success: 'success',
      error: () => 'error',
    }).catch(ora => ora);

    expect(spinner.fail).toHaveBeenCalledWith('error');
  });
});
