/**
 * @jest-environment jsdom
 */

jest.mock('expo', () => ({
  SharedRef: class SharedRef {
    nativeRefType?: string;
  },
}));

(globalThis as any).__DEV__ = false;
(globalThis as any).expo = {
  SharedObject: class SharedObject {
    emit() {}
  },
};

type VideoPlayerWebType = typeof import('../VideoPlayer.web').default;
const VideoPlayerWeb = require('../VideoPlayer.web').default as VideoPlayerWebType;

describe('VideoPlayerWeb.generateThumbnailsAsync', () => {
  let originalCreateElement: typeof document.createElement;
  let mockedCanvasToDataUrl: jest.Mock<string, [string]>;
  let mockedDrawImage: jest.Mock<void, [HTMLVideoElement, number, number, number, number]>;

  beforeEach(() => {
    mockedCanvasToDataUrl = jest.fn(() => 'data:image/jpeg;base64,thumbnail');
    mockedDrawImage = jest.fn();

    originalCreateElement = document.createElement.bind(document);

    jest.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      const element = originalCreateElement(tagName);

      if (tagName === 'video') {
        return createMockVideoElement(element as HTMLVideoElement) as HTMLElement;
      }

      if (tagName === 'canvas') {
        return createMockCanvasElement(
          element as HTMLCanvasElement,
          mockedDrawImage,
          mockedCanvasToDataUrl
        ) as HTMLElement;
      }

      return element;
    }) as typeof document.createElement);

    Object.defineProperty(globalThis.URL, 'createObjectURL', {
      value: jest.fn(() => 'blob:http://localhost/fetched-video'),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('preserves requested order while avoiding redundant renders for repeated target frames', async () => {
    const player = new VideoPlayerWeb('https://cdn.example.com/video.mp4');

    const thumbnails = await player.generateThumbnailsAsync([3, 0, 5], {
      maxWidth: 320,
      maxHeight: 200,
    });

    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]).toMatchObject({
      uri: 'data:image/jpeg;base64,thumbnail',
      width: 320,
      height: 180,
      requestedTime: 3,
      actualTime: 1.999,
      nativeRefType: 'image',
    });
    expect(thumbnails[1]).toMatchObject({
      uri: 'data:image/jpeg;base64,thumbnail',
      width: 320,
      height: 180,
      requestedTime: 0,
      actualTime: 0,
      nativeRefType: 'image',
    });
    expect(thumbnails[2]).toMatchObject({
      uri: 'data:image/jpeg;base64,thumbnail',
      width: 320,
      height: 180,
      requestedTime: 5,
      actualTime: 1.999,
      nativeRefType: 'image',
    });
    expect(mockedDrawImage).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLVideoElement),
      0,
      0,
      320,
      180
    );
    expect(mockedDrawImage).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLVideoElement),
      0,
      0,
      320,
      180
    );
    expect(mockedDrawImage).toHaveBeenCalledTimes(2);
  });

  it('uses anonymous CORS for direct network video sources', async () => {
    const player = new VideoPlayerWeb('https://cdn.example.com/video.mp4');

    await player.generateThumbnailsAsync(1.5);

    const video = getCreatedVideoElements()[0];
    expect(video?.crossOrigin).toBe('anonymous');
  });

  it('fetches remote sources with headers into a temporary blob URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['video-bytes'], { type: 'video/mp4' }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const player = new VideoPlayerWeb({
      uri: 'https://secure.example.com/video.mp4',
      headers: {
        Authorization: 'Bearer demo-token',
      },
    });

    await player.generateThumbnailsAsync(1.5);

    expect(fetchMock).toHaveBeenCalledWith('https://secure.example.com/video.mp4', {
      headers: {
        Authorization: 'Bearer demo-token',
      },
    });
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fetched-video');
  });

  it('returns an empty array when the player has no source', async () => {
    const player = new VideoPlayerWeb(null);

    await expect(player.generateThumbnailsAsync([0, 1])).resolves.toEqual([]);
  });

  it('rejects invalid thumbnail size limits', async () => {
    const player = new VideoPlayerWeb('https://cdn.example.com/video.mp4');

    await expect(
      player.generateThumbnailsAsync(1, {
        maxWidth: 0,
      })
    ).rejects.toThrow(
      'Failed to generate a thumbnail: The maxWidth and maxHeight parameters must be greater than zero.'
    );
  });
});

function getCreatedVideoElements(): HTMLVideoElement[] {
  return (document.createElement as jest.Mock).mock.results
    .map((result) => result.value)
    .filter((value): value is HTMLVideoElement => value instanceof HTMLVideoElement);
}

function createMockCanvasElement(
  canvas: HTMLCanvasElement,
  drawImage: jest.Mock<void, [HTMLVideoElement, number, number, number, number]>,
  toDataUrl: jest.Mock<string, [string]>
): HTMLCanvasElement {
  Object.defineProperty(canvas, 'getContext', {
    value: jest.fn(() => ({
      drawImage,
    })),
    configurable: true,
  });
  Object.defineProperty(canvas, 'toDataURL', {
    value: toDataUrl,
    configurable: true,
  });

  return canvas;
}

function createMockVideoElement(video: HTMLVideoElement): HTMLVideoElement {
  let currentTime = 0;
  let readyState = 0;

  Object.defineProperty(video, 'videoWidth', {
    value: 640,
    configurable: true,
  });
  Object.defineProperty(video, 'videoHeight', {
    value: 360,
    configurable: true,
  });
  Object.defineProperty(video, 'duration', {
    value: 2,
    configurable: true,
  });
  Object.defineProperty(video, 'readyState', {
    get: () => readyState,
    configurable: true,
  });
  Object.defineProperty(video, 'currentTime', {
    get: () => currentTime,
    set: (value: number) => {
      currentTime = value;
      setTimeout(() => {
        video.dispatchEvent(new Event('seeked'));
      }, 0);
    },
    configurable: true,
  });
  Object.defineProperty(video, 'load', {
    value: jest.fn(() => {
      readyState = 3;
      setTimeout(() => {
        video.dispatchEvent(new Event('loadeddata'));
      }, 0);
    }),
    configurable: true,
  });
  Object.defineProperty(video, 'pause', {
    value: jest.fn(),
    configurable: true,
  });

  return video;
}
