import { LinearGradient } from 'expo-blur';
import React from 'react';

import { mountAndWaitFor } from './helpers';

export const name = 'LinearGradient';
const style = { width: 200, height: 200 };

export async function test(
  { it, describe, beforeAll, jasmine, afterAll, expect, afterEach, beforeEach },
  { setPortalChild, cleanupPortal }
) {
  afterEach(async () => {
    await cleanupPortal();
  });

  describe(name, () => {
    it(`renders`, async () => {
      await mountAndWaitFor(<LinearGradient colors={['red', 'blue']} style={style} />);
    });
  });
}
