import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

export const name = 'NavigationBar';

export async function test(t) {
  if (Platform.OS !== 'android') return;
  async function flipValueAsync({ getAsync, setAsync, values }) {
    // Set initial value to adjust for any state.
    await setAsync(values[0]);

    // Get the newly set value.
    const value = await getAsync();
    t.expect(value).toBeDefined();
    t.expect(value).toBe(values[0]);

    // Toggle value again and ensure it's different.
    const nextValue = value === values[0] ? values[1] : values[0];
    await setAsync(nextValue);
    const mutated = await getAsync();
    t.expect(mutated).toBe(nextValue);
  }

  t.describe(`NavigationBar.setButtonStyleAsync()`, () => {
    t.it(`flips a value`, async () => {
      await flipValueAsync({
        getAsync: NavigationBar.getButtonStyleAsync,
        setAsync: NavigationBar.setButtonStyleAsync,
        values: ['light', 'dark'],
      });
    });
  });

  t.describe(`NavigationBar.setPositionAsync()`, () => {
    t.it(`flips a value`, async () => {
      await flipValueAsync({
        getAsync: NavigationBar.unstable_getPositionAsync,
        setAsync: NavigationBar.setPositionAsync,
        values: ['absolute', 'relative'],
      });
    });
  });

  t.describe(`NavigationBar.setVisibilityAsync()`, () => {
    t.it(`flips a value`, async () => {
      await flipValueAsync({
        getAsync: NavigationBar.getVisibilityAsync,
        setAsync: NavigationBar.setVisibilityAsync,
        values: ['visible', 'hidden'],
      });
    });
  });
  t.describe(`NavigationBar.setBehaviorAsync()`, () => {
    t.it(`flips a value`, async () => {
      await flipValueAsync({
        getAsync: NavigationBar.getBehaviorAsync,
        setAsync: NavigationBar.setBehaviorAsync,
        values: ['overlay-swipe', 'inset-touch'],
      });
    });
  });
  t.describe(`NavigationBar.setBorderColorAsync()`, () => {
    t.it(`flips a value`, async () => {
      await flipValueAsync({
        getAsync: NavigationBar.getBorderColorAsync,
        setAsync: NavigationBar.setBorderColorAsync,
        values: ['#ff0000', '#ff00ff'],
      });
    });
  });
  t.describe(`NavigationBar.setBackgroundColorAsync()`, () => {
    t.it(`flips a value`, async () => {
      await flipValueAsync({
        getAsync: NavigationBar.getBackgroundColorAsync,
        setAsync: NavigationBar.setBackgroundColorAsync,
        values: ['#ff0000', '#ff00ff'],
      });
    });
  });
}
