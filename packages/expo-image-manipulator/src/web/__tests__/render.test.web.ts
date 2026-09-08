/** @jest-environment jsdom */

import ImageManipulatorContext from '../ImageManipulatorContext.web';

describe('rendering during release', () => {
  const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:rendered'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    });
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: jest.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalCreateObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
    } else {
      delete (URL as Partial<typeof URL>).createObjectURL;
    }
    if (originalRevokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
    } else {
      delete (URL as Partial<typeof URL>).revokeObjectURL;
    }
  });

  it.each(['release', 'reset'] as const)(
    'encodes an independent canvas while %s clears the context',
    async (action) => {
      const source = document.createElement('canvas');
      source.width = 300;
      source.height = 150;
      const context = new ImageManipulatorContext(() => source);
      const encodingStarted = new Promise<[HTMLCanvasElement, BlobCallback]>((resolve) => {
        jest
          .spyOn(HTMLCanvasElement.prototype, 'toBlob')
          .mockImplementation(function (this: HTMLCanvasElement, callback) {
            resolve([this, callback]);
          });
      });
      const render = context.renderAsync();
      const [encodedCanvas, finishEncoding] = await encodingStarted;

      context[action]();
      await Promise.resolve();

      expect(source.width).toBe(0);
      expect(source.height).toBe(0);
      expect(encodedCanvas).not.toBe(source);
      expect(encodedCanvas.width).toBe(300);
      expect(encodedCanvas.height).toBe(150);

      const blob = new Blob(['image'], { type: 'image/png' });
      finishEncoding(blob);
      const image = await render;
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(image.uri).toBe('blob:rendered');
      expect(image.width).toBe(300);
      expect(image.height).toBe(150);
      image.release();
      context.release();
    }
  );

  it('uses the clone for the data URL fallback after release', async () => {
    const source = document.createElement('canvas');
    const context = new ImageManipulatorContext(() => source);
    const encodingStarted = new Promise<BlobCallback>((resolve) => {
      jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(resolve);
    });
    const toDataURL = jest
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/png;base64,rendered');
    const render = context.renderAsync();
    const finishEncoding = await encodingStarted;

    context.release();
    await Promise.resolve();
    finishEncoding(null);

    const image = await render;
    expect(toDataURL.mock.instances[0]).toBe(image.canvas);
    expect(image.uri).toBe('data:image/png;base64,rendered');
    expect(image.width).toBe(300);
    expect(image.height).toBe(150);
    image.release();
  });
});
