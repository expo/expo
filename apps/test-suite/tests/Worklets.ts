import { WorkletsTester } from 'worklets-tester';

import type { JasmineInterface } from '../types';

export const name = 'Worklets';

export function test({ describe, expect, it, beforeAll }: JasmineInterface) {
  describe('UI runtime', () => {
    beforeAll(() => {
      WorkletsTester.installUIRuntime();
    });

    it('runs scheduled work on the main thread', async () => {
      expect(await WorkletsTester.isUIRuntimeWorkOnMainThread()).toBe(true);
    });

    it('has the macro members of the core module', async () => {
      expect(await WorkletsTester.evaluateOnUIRuntime('typeof expo.installOnUIRuntime')).toBe(
        'function'
      );
    });
  });
}
