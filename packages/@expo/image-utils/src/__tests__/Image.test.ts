import parsePng from 'parse-png';
import * as path from 'path';

import { generateImageAsync, getPngInfo, getMimeType } from '../Image';

describe(getMimeType, () => {
  (
    [
      ['https://example.com/image.png?query=1', 'image/png'],
      ['../foo.jpg', 'image/jpeg'],
      ['more.ios.jpeg', 'image/jpeg'],
      ['icon.PNG', 'image/png'],
      ['splash.JPG', 'image/jpeg'],
      ['https://example.com/Icon.Webp?query=1', 'image/webp'],
      ['favicon.svg', 'image/svg+xml'],
      // Invalid
      ['more.ios.jpeg?foo', null],
      // Unsupported
      ['more.ios.avif', null],
    ] as const
  ).forEach(([url, mimeType]) => {
    it(`returns mime type for URL: ${url}`, () => {
      expect(getMimeType(url)).toBe(mimeType);
    });
  });
});

describe('Image #getPngInfo', () => {
  it('returns false if the file does not exist', async () => {
    try {
      await getPngInfo('random/path');
    } catch (e) {
      expect((e as Error).message).toEqual("ENOENT: no such file or directory, open 'random/path'");
    }
  });

  it('returns false if the file is a jpg', async () => {
    try {
      await getPngInfo(path.join(__dirname, '/assets/icon.jpg'));
    } catch (e) {
      expect((e as Error).message).toEqual('Invalid file signature');
    }
  });

  it('returns false if the file is a svg', async () => {
    try {
      await getPngInfo(path.join(__dirname, '/assets/icon.svg'));
    } catch (e) {
      expect((e as Error).message).toEqual('Invalid file signature');
    }
  });

  it('returns false if the file is a pdf', async () => {
    try {
      await getPngInfo(path.join(__dirname, '/assets/icon.pdf'));
    } catch (e) {
      expect((e as Error).message).toEqual('Invalid file signature');
    }
  });

  it('returns false if the file is a jpg with the file exstention chaneg to png', async () => {
    try {
      await getPngInfo(path.join(__dirname, '/assets/fakePng.png'));
    } catch (e) {
      expect((e as Error).message).toEqual('Invalid file signature');
    }
  });

  it('returns true if the file is a png', async () => {
    expect(await getPngInfo(path.join(__dirname, '/assets/icon.png'))).toHaveProperty('width', 100);
  });
});

describe(generateImageAsync, () => {
  it('rasterizes an SVG source into a PNG named with a .png extension', async () => {
    const { name, source } = await generateImageAsync(
      { projectRoot: __dirname },
      { src: path.join(__dirname, 'assets/icon.svg'), resizeMode: 'contain', width: 48, height: 48 }
    );

    expect(name).toBe('icon_48.png');
    const info = await parsePng(source);
    expect(info).toMatchObject({ width: 48, height: 48 });
  });

  it('explains that SVG sources require sharp-cli when sharp is unavailable', async () => {
    process.env.EXPO_IMAGE_UTILS_NO_SHARP = '1';
    try {
      await expect(
        generateImageAsync(
          { projectRoot: __dirname },
          {
            src: path.join(__dirname, 'assets/icon.svg'),
            resizeMode: 'contain',
            width: 48,
            height: 48,
          }
        )
      ).rejects.toThrow(/SVG.*sharp-cli/);
    } finally {
      delete process.env.EXPO_IMAGE_UTILS_NO_SHARP;
    }
  });
});
