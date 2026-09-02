import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { isOtpError, withOtpRetry } from './NpmOtp';

const originalOtp = process.env.NPM_OTP;

afterEach(() => {
  if (originalOtp === undefined) {
    delete process.env.NPM_OTP;
  } else {
    process.env.NPM_OTP = originalOtp;
  }
});

function spawnError(stderr: string): Error {
  return Object.assign(new Error('npm owner rm exited with non-zero code: 1'), { stderr });
}

describe('isOtpError', () => {
  it('detects the `EOWNERMUTATE` wrapper that `npm owner rm` puts around an OTP failure', () => {
    // `npm-registry-fetch` throws `HttpErrorAuthOTP`, whose message is exactly
    // this, and `npm owner rm` replaces the `EOTP` code with its own generic
    // one. So neither `EOTP` nor `one-time pass` appears anywhere in stderr.
    const error = spawnError(
      [
        'npm error code EOWNERMUTATE',
        'npm error Failed to update package: "OTP required for authentication"',
      ].join('\n')
    );
    assert.equal(isOtpError(error), true);
  });

  it('detects the plain `one-time pass` heuristic that npm uses for malformed responses', () => {
    assert.equal(isOtpError(spawnError('npm error you must provide a one-time pass')), true);
  });

  it('detects the `EOTP` code', () => {
    assert.equal(isOtpError(spawnError('npm error code EOTP')), true);
  });

  it('returns false for a permission failure', () => {
    const error = spawnError(
      ['npm error code E403', 'npm error 403 Forbidden - PUT https://registry.npmjs.org/'].join(
        '\n'
      )
    );
    assert.equal(isOtpError(error), false);
  });
});

describe('withOtpRetry', () => {
  it('does not prompt when the first attempt succeeds', async () => {
    let prompts = 0;
    let calls = 0;

    await withOtpRetry(
      async () => {
        calls++;
      },
      async () => {
        prompts++;
        return '111111';
      }
    );

    assert.equal(calls, 1);
    assert.equal(prompts, 0);
  });

  it('prompts and retries when npm asks for a one-time password', async () => {
    let calls = 0;

    await withOtpRetry(
      async () => {
        if (++calls === 1) {
          throw spawnError('npm error Failed to update package: "requires a one-time password"');
        }
      },
      async () => '222222'
    );

    assert.equal(calls, 2);
    assert.equal(process.env.NPM_OTP, '222222');
  });

  it('re-prompts for every OTP failure until the call succeeds', async () => {
    const codes = ['333333', '444444'];
    let calls = 0;

    await withOtpRetry(
      async () => {
        if (++calls <= 2) {
          throw spawnError('npm error code EOTP');
        }
      },
      async () => codes.shift()!
    );

    assert.equal(calls, 3);
    assert.equal(process.env.NPM_OTP, '444444');
  });

  it('rethrows a non-OTP error unchanged and without prompting', async () => {
    const thrown = spawnError('npm error code E403\nnpm error 403 Forbidden');
    let prompts = 0;

    await assert.rejects(
      () =>
        withOtpRetry(
          async () => {
            throw thrown;
          },
          async () => {
            prompts++;
            return '555555';
          }
        ),
      (error: unknown) => error === thrown
    );

    assert.equal(prompts, 0);
  });
});
