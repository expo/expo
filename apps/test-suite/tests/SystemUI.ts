import * as SystemUI from 'expo-system-ui';
import type { ColorValue } from 'react-native';

import type { JasmineInterface } from '../types';

export const name = 'SystemUI';

export async function test(t: JasmineInterface) {
  async function flipValueAsync({
    getAsync,
    setAsync,
    values,
  }: {
    getAsync: () => Promise<ColorValue | null>;
    setAsync: (value: ColorValue | null) => Promise<void>;
    values: [string, string];
  }) {
    // Set initial value to adjust for any state.
    await setAsync(values[0]);

    // Get the newly set value.
    const value = await getAsync();
    t.expect(value).toBeDefined();
    // Typed `ColorValue`, but every platform resolves it to a hex string.
    const currentValue = String(value);
    t.expect(currentValue.toUpperCase()).toBe(values[0]);

    // Toggle value again and ensure it's different.
    const nextValue = currentValue === values[0] ? values[1] : values[0];
    await setAsync(nextValue);
    const mutated = String(await getAsync());
    t.expect(mutated.toUpperCase()).toBe(nextValue);
  }
  t.describe(`SystemUI.setBackgroundColorAsync()`, () => {
    t.it(`flips a value`, async () => {
      await flipValueAsync({
        getAsync: SystemUI.getBackgroundColorAsync,
        setAsync: SystemUI.setBackgroundColorAsync,
        values: ['#FF0000', '#FFFFFF'],
      });
    });
  });
}
