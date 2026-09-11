import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isTrustedPublishingEnvironment } from './checkEnvironmentTask';

describe('isTrustedPublishingEnvironment', () => {
  it('is true when the Actions OIDC endpoint is available', () => {
    assert.equal(
      isTrustedPublishingEnvironment({
        ACTIONS_ID_TOKEN_REQUEST_URL: 'https://pipelines.actions.githubusercontent.com/abc',
      }),
      true
    );
  });

  it('is false without the OIDC endpoint, even on CI', () => {
    assert.equal(isTrustedPublishingEnvironment({ CI: 'true' }), false);
  });

  it('is false locally', () => {
    assert.equal(isTrustedPublishingEnvironment({}), false);
  });

  // The runner only sets this variable when the job requests `id-token: write`,
  // so an empty value means the permission was not granted.
  it('is false when the variable is set but empty', () => {
    assert.equal(isTrustedPublishingEnvironment({ ACTIONS_ID_TOKEN_REQUEST_URL: '' }), false);
  });
});
