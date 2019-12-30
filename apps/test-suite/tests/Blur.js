import { BlurView } from 'expo-blur';
import React from 'react';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'Blur';
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
    describe('create', () => {
      for (const color of ['light', 'dark', 'default']) {
        it(`uses ${color} color`, async () => {
          await mountAndWaitFor(<BlurView style={style} tint={color} intensity={50} />);
        });
      }
    });
  });
}
