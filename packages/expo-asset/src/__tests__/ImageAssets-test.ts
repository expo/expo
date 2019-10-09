/* global Image:true */
import * as ImageAssets from '../ImageAssets';

describe('isImageType', () => {
  it(`recognizes popular web image types`, () => {
    expect(ImageAssets.isImageType('jpeg')).toBe(true);
    expect(ImageAssets.isImageType('png')).toBe(true);
    expect(ImageAssets.isImageType('gif')).toBe(true);
    expect(ImageAssets.isImageType('webp')).toBe(true);
  });

  it(`doesn't recognize non-image types`, () => {
    expect(ImageAssets.isImageType('')).toBe(false);
    expect(ImageAssets.isImageType('js')).toBe(false);
    expect(ImageAssets.isImageType('txt')).toBe(false);
  });
});

describe('getImageInfoAsync', () => {
  let originalImage: any;

  beforeAll(() => {
    // @ts-ignore
    originalImage = global.Image;
    Image = jest.fn();
  });

  afterAll(() => {
    Image = originalImage;
  });

  it(`fetches images by setting the "src" property`, () => {
    ImageAssets.getImageInfoAsync('https://example.com/example.png');
    expect((Image as jest.Mock<HTMLImageElement>).mock.instances.length).toBe(1);
    let mockImage = (Image as jest.Mock<HTMLImageElement>).mock.instances[0];
    expect(mockImage.src).toBe('https://example.com/example.png');
  });

  it(`resolves the promise when the image loads`, async () => {
    let infoPromise = ImageAssets.getImageInfoAsync('https://example.com/example.png');
    let mockImage = (Image as jest.Mock<HTMLImageElement>).mock.instances[0];
    expect(mockImage.onload).toBeDefined();

    // @ts-ignore: naturalWidth is declared as read-only
    mockImage.naturalWidth = 300;
    // @ts-ignore: naturalHeight is declared as read-only
    mockImage.naturalHeight = 400;

    let mockLoadEvent = { type: 'load' } as any;
    mockImage.onload!(mockLoadEvent);

    await expect(infoPromise).resolves.toEqual({
      name: 'example.png',
      width: 300,
      height: 400,
    });
  });

  it(`rejects the promise when the image fails to load`, async () => {
    let infoPromise = ImageAssets.getImageInfoAsync('https://example.com/example.png');
    let mockImage = (Image as jest.Mock<HTMLImageElement>).mock.instances[0];
    expect(mockImage.onerror).toBeDefined();

    let mockErrorEvent = { type: 'error' } as any;
    mockImage.onerror!(mockErrorEvent);

    // TODO: change this to a proper Error
    await expect(infoPromise).rejects.toBe(mockErrorEvent);
  });
});
