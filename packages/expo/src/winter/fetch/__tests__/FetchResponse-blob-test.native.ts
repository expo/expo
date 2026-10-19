import { FetchResponse } from '../FetchResponse';

jest.mock('../ExpoFetchModule', () => {
  const helloWorld = new TextEncoder().encode('hello world');

  class StubNativeResponse {
    // Getters on the prototype, like the real native binding, so super.x works.
    get _rawHeaders(): [string, string][] {
      return [['content-type', 'text/plain']];
    }

    addListener() {}
    removeListener() {}
    removeAllListeners() {}

    async arrayBuffer(): Promise<ArrayBuffer> {
      return helloWorld.buffer.slice(
        helloWorld.byteOffset,
        helloWorld.byteOffset + helloWorld.byteLength
      ) as ArrayBuffer;
    }
  }

  return {
    ExpoFetchModule: {
      NativeResponse: StubNativeResponse,
      unstable_createBlobData: jest.fn(async () => 'mock-blob-id'),
    },
  };
});

describe('FetchResponse blob() with react-native Blob', () => {
  const originalBlob = globalThis.Blob;
  const RNBlob = require('react-native/Libraries/Blob/Blob').default;
  const { ExpoFetchModule } = require('../ExpoFetchModule');

  beforeEach(() => {
    globalThis.Blob = RNBlob;
    ExpoFetchModule.unstable_createBlobData.mockClear();
  });

  afterEach(() => {
    globalThis.Blob = originalBlob;
  });

  function makeResponse(): FetchResponse {
    return new FetchResponse(() => {});
  }

  it('should warn about the performance overhead only once', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await makeResponse().blob();
      await makeResponse().blob();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('expo-blob'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('should return a react-native blob backed by the native blob store', async () => {
    const response = makeResponse();
    const blob = await response.blob();

    expect(blob).toBeInstanceOf(RNBlob);
    expect((blob as any).data.blobId).toBe('mock-blob-id');
    expect(blob.size).toBe(11);
    expect(blob.type).toBe('text/plain');
  });

  it('should store the body bytes in the native blob store', async () => {
    const response = makeResponse();
    await response.blob();

    expect(ExpoFetchModule.unstable_createBlobData).toHaveBeenCalledTimes(1);
    const bytes = ExpoFetchModule.unstable_createBlobData.mock.calls[0][0] as Uint8Array;
    expect(new TextDecoder().decode(bytes)).toBe('hello world');
  });

  it('should reject a second blob() call with TypeError', async () => {
    const response = makeResponse();
    await response.blob();
    await expect(response.blob()).rejects.toThrow(TypeError);
  });
});
