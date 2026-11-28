import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SPMProduct } from './SPMConfig.types';
import schema from './schemas/spm.config.schema.json';

describe('spm.config.json product releaseFlavor', () => {
  it('accepts only "stub" and "realAndStub" in the schema', () => {
    assert.deepEqual(schema.definitions.product.properties.releaseFlavor.enum, [
      'stub',
      'realAndStub',
    ]);
    assert.equal(schema.definitions.product.additionalProperties, false);
  });

  it('accepts only "stub" and "realAndStub" in the type', () => {
    const stub: SPMProduct['releaseFlavor'] = 'stub';
    const realAndStub: SPMProduct['releaseFlavor'] = 'realAndStub';
    // @ts-expect-error a release flavor other than "stub" or "realAndStub" is not configurable
    const rejected: SPMProduct['releaseFlavor'] = 'debug';
    assert.deepEqual([stub, realAndStub, rejected], ['stub', 'realAndStub', 'debug']);
  });
});
