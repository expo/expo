import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

export const name = 'Clipboard';

export function test({ describe, expect, it, afterEach, ...t }) {
  describe('Clipboard', () => {
    const throws = async (run) => {
      let error = null;
      try {
        await run();
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
    };

    afterEach(async () => {
      await Clipboard.setStringAsync('');
    });

    describe('Strings', () => {
      it('sets and gets a string', async () => {
        await Clipboard.setStringAsync('test string');
        const result = await Clipboard.getStringAsync();
        expect(result).toEqual('test string');
      });

      it('checks if clipboard has string content', async () => {
        await Clipboard.setStringAsync('test string');
        const result = await Clipboard.hasStringAsync();
        expect(result).toBe(true);
      });

      it('gets and sets HTML string', async () => {
        await Clipboard.setStringAsync('<p>test</p>', {
          inputFormat: Clipboard.StringFormat.HTML,
        });
        const result = await Clipboard.getStringAsync({
          preferredFormat: Clipboard.StringFormat.HTML,
        });
        // The OS can add some atributes or inner tags to the HTML string, so we can't just
        // check for equality.
        expect(/<p(\s.*)?>(<.*>)?test(<\/.*>)?<\/p>/gi.test(result)).toBe(true);
      });

      it('gets plain text from copied HTML', async () => {
        await Clipboard.setStringAsync('<p>test</p>', {
          inputFormat: Clipboard.StringFormat.HTML,
        });
        const result = await Clipboard.getStringAsync({
          preferredFormat: Clipboard.StringFormat.PLAIN_TEXT,
        });
        expect(result.trim()).toEqual('test');
      });

      it('falls back to plain text if no HTML is copied', async () => {
        await Clipboard.setStringAsync('test', { inputFormat: Clipboard.StringFormat.PLAIN_TEXT });
        const result = await Clipboard.getStringAsync({
          preferredFormat: Clipboard.StringFormat.HTML,
        });
        expect(result).toEqual('test');
      });

      if (Platform.OS === 'android') {
        it('sets a string with isSensitive option', async () => {
          await Clipboard.setStringAsync('sensitive data', { android: { isSensitive: true } });
          const result = await Clipboard.getStringAsync();
          expect(result).toEqual('sensitive data');
        });

        it('sets a string with isSensitive false', async () => {
          await Clipboard.setStringAsync('public data', { android: { isSensitive: false } });
          const result = await Clipboard.getStringAsync();
          expect(result).toEqual('public data');
        });

        it('sets HTML string with isSensitive option', async () => {
          await Clipboard.setStringAsync('<p>sensitive html</p>', {
            inputFormat: Clipboard.StringFormat.HTML,
            android: { isSensitive: true },
          });
          const result = await Clipboard.getStringAsync({
            preferredFormat: Clipboard.StringFormat.PLAIN_TEXT,
          });
          expect(result.trim()).toEqual('sensitive html');
        });
      }
    });

    if (Platform.OS === 'ios') {
      describe('URLs', () => {
        it('sets and gets an url', async () => {
          const exampleUrl = 'https://example.com';
          let hasUrl = await Clipboard.hasUrlAsync();
          expect(hasUrl).toEqual(false);
          await Clipboard.setUrlAsync(exampleUrl);
          hasUrl = await Clipboard.hasUrlAsync();
          expect(hasUrl).toEqual(true);
          const result = await Clipboard.getUrlAsync();
          expect(result).toEqual(exampleUrl);
        });
      });
    }

    describe('Images', () => {
      it('sets and gets a png image', async () => {
        const imageBase64 =
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
        const expectedResultRegex = 'data:image/png;base64,[A-Za-z0-9+/=]*';
        let hasImage = await Clipboard.hasImageAsync();
        expect(hasImage).toEqual(false);
        await Clipboard.setImageAsync(imageBase64);
        hasImage = await Clipboard.hasImageAsync();
        expect(hasImage).toEqual(true);
        const result = await Clipboard.getImageAsync({ format: 'png' });
        expect(result.data).toMatch(expectedResultRegex);
      });

      if (Platform.OS !== 'web') {
        it('sets and gets a jpg image', async () => {
          const imageBase64 =
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
          const expectedResultRegex = 'data:image/jpeg;base64,[A-Za-z0-9+/=]*';
          let hasImage = await Clipboard.hasImageAsync();
          expect(hasImage).toEqual(false);
          await Clipboard.setImageAsync(imageBase64);
          hasImage = await Clipboard.hasImageAsync();
          expect(hasImage).toEqual(true);
          const result = await Clipboard.getImageAsync({ format: 'jpeg' });
          expect(result.data).toMatch(expectedResultRegex);
        });

        it('rejects invalid base64', async () => {
          const imageBase64 = 'invalid';
          await throws(() => Clipboard.setImageAsync(imageBase64));
          const hasImage = await Clipboard.hasImageAsync();
          expect(hasImage).toEqual(false);
        });

        if (Platform.OS === 'android') {
          it('sets an image with isSensitive option', async () => {
            const imageBase64 =
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
            const expectedResultRegex = 'data:image/png;base64,[A-Za-z0-9+/=]*';
            await Clipboard.setImageAsync(imageBase64, { android: { isSensitive: true } });
            const hasImage = await Clipboard.hasImageAsync();
            expect(hasImage).toEqual(true);
            const result = await Clipboard.getImageAsync({ format: 'png' });
            expect(result.data).toMatch(expectedResultRegex);
          });

          it('sets an image with isSensitive false', async () => {
            const imageBase64 =
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
            const expectedResultRegex = 'data:image/png;base64,[A-Za-z0-9+/=]*';
            await Clipboard.setImageAsync(imageBase64, { android: { isSensitive: false } });
            const hasImage = await Clipboard.hasImageAsync();
            expect(hasImage).toEqual(true);
            const result = await Clipboard.getImageAsync({ format: 'png' });
            expect(result.data).toMatch(expectedResultRegex);
          });
        }
      }
    });
  });
}
