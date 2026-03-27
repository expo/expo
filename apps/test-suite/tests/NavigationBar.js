import { getVisibilityAsync, setVisibilityAsync } from 'expo-navigation-bar';
import { Platform } from 'react-native';

export const name = 'NavigationBar';

export async function test(t) {
  if (Platform.OS !== 'android') return;

  t.describe(`NavigationBar.setVisibilityAsync()`, () => {
    t.it(`flips a value`, async () => {
      // Set initial value to adjust for any state.
      await setVisibilityAsync('visible');

      // Get the newly set value.
      const value = await getVisibilityAsync();
      t.expect(value).toBeDefined();
      t.expect(value).toBe('visible');

      // Toggle value again and ensure it's different.
      const nextValue = value === 'visible' ? 'hidden' : 'visible';
      await setVisibilityAsync(nextValue);
      const mutated = await getVisibilityAsync();
      t.expect(mutated).toBe(nextValue);
    });
  });
}
