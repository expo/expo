import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SPMProduct } from './SPMConfig.types';
import schema from './schemas/spm.config.schema.json';

describe('spm.config.json product releaseFlavor', () => {
  it('accepts only "stub" in the schema', () => {
    assert.deepEqual(schema.definitions.product.properties.releaseFlavor.enum, ['stub']);
    assert.equal(schema.definitions.product.additionalProperties, false);
  });

  it('accepts only "stub" in the type', () => {
    const accepted: SPMProduct['releaseFlavor'] = 'stub';
    // @ts-expect-error a release flavor other than "stub" is not configurable
    const rejected: SPMProduct['releaseFlavor'] = 'debug';
    assert.deepEqual([accepted, rejected], ['stub', 'debug']);
  });
});
