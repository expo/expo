import * as SystemUI from 'expo-system-ui';

export const name = 'SystemUI';

export async function test(t) {
  async function flipValueAsync({ getAsync, setAsync, values }) {
    // Set initial value to adjust for any state.
    await setAsync(values[0]);

    // Get the newly set value.
    const value = await getAsync();
    t.expect(value).toBeDefined();
    t.expect(value.toUpperCase()).toBe(values[0]);

    // Toggle value again and ensure it's different.
    const nextValue = value === values[0] ? values[1] : values[0];
    await setAsync(nextValue);
    const mutated = await getAsync();
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
