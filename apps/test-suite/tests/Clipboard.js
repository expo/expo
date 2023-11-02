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

        it('rejects a malformed url', async () => {
          const malformedUrl = 'malformed url';
          await throws(() => Clipboard.setUrlAsync(malformedUrl));
          const hasUrl = await Clipboard.hasUrlAsync();
          expect(hasUrl).toEqual(false);
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
      it('sets and gets a gif image', async () => {
        const gifBase64 =
          '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';
        const expectedResultRegex = 'data:image/gif;base64,[A-Za-z0-9+/=]*';
        let hasImage = await Clipboard.hasImageAsync();
        expect(hasImage).toEqual(false);
        await Clipboard.setImageAsync(gifBase64);
        hasImage = await Clipboard.hasImageAsync();
        expect(hasImage).toEqual(true);
        const result = await Clipboard.getImageAsync({ format: 'gif' });
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
      }
    });
  });
}
