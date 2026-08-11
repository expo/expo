import { BlurView, type BlurTint } from 'expo-blur';
import React, { type ReactElement } from 'react';

import type { JasmineInterface, TestPortal } from '../types';
import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'Blur';
const style = { width: 200, height: 200 };

export async function test(
  { it, describe, afterEach }: JasmineInterface,
  { setPortalChild, cleanupPortal }: TestPortal
) {
  afterEach(async () => {
    await cleanupPortal();
  });

  const mountAndWaitFor = (child: ReactElement<any>, propName = 'onLayout') =>
    originalMountAndWaitFor(child, propName, setPortalChild);

  describe(name, () => {
    describe('create', () => {
      for (const color of ['light', 'dark', 'default'] satisfies BlurTint[]) {
        it(`uses ${color} color`, async () => {
          await mountAndWaitFor(<BlurView style={style} tint={color} intensity={50} />);
        });
      }
    });
  });
}
