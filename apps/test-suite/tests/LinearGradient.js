import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'LinearGradient';
const style = { width: 200, height: 200 };

export async function test(
  { it, describe, beforeAll, jasmine, afterAll, expect, afterEach, beforeEach },
  { setPortalChild, cleanupPortal }
) {
  afterEach(async () => {
    await cleanupPortal();
  });

  const mountAndWaitFor = (child, propName = 'onLayout') =>
    originalMountAndWaitFor(child, propName, setPortalChild);

  describe(name, () => {
    it(`renders`, async () => {
      await mountAndWaitFor(<LinearGradient colors={['red', 'blue']} style={style} />);
    });
  });
}
