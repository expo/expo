import { isRunningInExpoGo } from 'expo';
import * as Font from 'expo-font';
import { Platform } from 'react-native';

export const name = 'Font';

export async function test({ beforeEach, afterAll, describe, it, expect }) {
  describe(name, () => {
    async function unloadFontAsync() {
      if (Platform.OS === 'web') {
        await Font.unloadAsync('cool-font');
      }
    }
    beforeEach(async () => {
      await unloadFontAsync();
    });

    afterAll(async () => {
      await unloadFontAsync();
    });

    if (Platform.OS === 'web') {
      it(`loads`, async () => {
        let error = null;
        expect(Font.isLoaded('cool-font')).toBe(
          false,
          'Font should not be loaded before loadAsync is called'
        );
        expect(Font.isLoading('cool-font')).toBe(
          false,
          'Font should not be loading before loadAsync is called'
        );
        const loadedFontsPrior = Font.getLoadedFonts();
        expect(loadedFontsPrior.length >= 25).toBe(true);

        try {
          await Font.loadAsync({
            'cool-font': {
              uri: require('../assets/comic.ttf'),
              display: Font.FontDisplay.SWAP,
            },
          });
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
        expect(Font.isLoaded('cool-font')).toBe(
          true,
          'Font should be loaded after loadAsync resolves'
        );

        expect(Font.getLoadedFonts().length).toBe(loadedFontsPrior.length + 1);

        const styleSheet = document.getElementById('expo-generated-fonts');
        expect(!!styleSheet).toBe(true);
        const [rule] = [...styleSheet.sheet.cssRules].filter((rule) => {
          return (
            rule instanceof CSSFontFaceRule &&
            rule.style.fontFamily === 'cool-font' &&
            rule.style.fontDisplay === 'swap'
          );
        });
        expect(!!rule).toBe(true);
      });
    }

    if (Platform.OS !== 'web' && !isRunningInExpoGo()) {
      it(`isLoaded should support custom native fonts`, () => {
        expect(Font.isLoaded('icomoon')).toBe(true);
        expect(Font.isLoaded('NonExistedFont')).toBe(false);
      });
    }

    it('allows loading the same font multiple times', async () => {
      let error = null;

      try {
        for (let i = 0; i < 3; i++) {
          await Font.loadAsync({
            'cool-font': {
              uri: require('../assets/comic.ttf'),
              display: Font.FontDisplay.SWAP,
            },
          });
        }
      } catch (e) {
        error = e;
      }
      expect(error).toBeNull();
      expect(Font.isLoaded('cool-font')).toBe(true);
    });
  });
}
