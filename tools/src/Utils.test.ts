import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { spawnErrorOutput } from './Utils';

describe('spawnErrorOutput', () => {
  it('joins stderr and stdout of a failed spawn', () => {
    const error = Object.assign(new Error('exited with non-zero code: 1'), {
      stdout: '{ "error": { "code": "E401" } }',
      stderr: 'npm error code E401',
    });
    assert.equal(spawnErrorOutput(error), 'npm error code E401\n{ "error": { "code": "E401" } }');
  });

  it('reads output exposed through getters', () => {
    const error = new Error('exited with non-zero code: 1');
    Object.defineProperties(error, {
      stdout: { get: () => '', enumerable: false },
      stderr: { get: () => 'npm error code E401', enumerable: false },
    });
    assert.equal(spawnErrorOutput(error), 'npm error code E401');
  });

  it('trims surrounding whitespace of each stream', () => {
    const error = Object.assign(new Error('failed'), { stdout: '  out  \n', stderr: '\nerr\n' });
    assert.equal(spawnErrorOutput(error), 'err\nout');
  });

  it('returns an empty string when there is no output', () => {
    assert.equal(spawnErrorOutput(new Error('failed')), '');
    assert.equal(spawnErrorOutput(Object.assign(new Error('failed'), { stderr: '\n' })), '');
  });

  it('ignores values that are not strings', () => {
    assert.equal(spawnErrorOutput(null), '');
    assert.equal(spawnErrorOutput('not an error'), '');
    assert.equal(spawnErrorOutput(Object.assign(new Error('failed'), { stderr: 123 })), '');
  });
});
