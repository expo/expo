import * as Font from 'expo-font';

export const name = 'Font';

export async function test({ describe, it, expect }) {
  describe(name, () => {
    it(`loads`, async () => {
      let error = null;
      try {
        await Font.loadAsync({
          'cool-font': require('../assets/comic.ttf'),
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeNull();
    });
  });
}
