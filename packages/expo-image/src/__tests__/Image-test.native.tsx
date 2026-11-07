import { Image } from '../Image';

jest.mock('../ImageModule', () => {
  const state: {
    createLoadAsync?: (implementation: Function) => Function;
    captureDevToolsRequestId?: () => string;
  } = {
    createLoadAsync: (implementation) => (source: unknown, options: unknown) => {
      const existing =
        source && typeof source === 'object' && 'devToolsRequestId' in source
          ? (source as { devToolsRequestId?: string }).devToolsRequestId
          : undefined;
      return implementation(source, options, existing ?? 'from-host');
    },
    captureDevToolsRequestId: () => 'from-render',
  };

  return {
    __esModule: true,
    __state: state,
    default: {
      loadAsync: jest.fn(async () => ({ width: 1, height: 1 })),
      get createLoadAsync() {
        return state.createLoadAsync;
      },
      get captureDevToolsRequestId() {
        return state.captureDevToolsRequestId;
      },
    },
  };
});

describe('Image DevTools initiator', () => {
  const ImageModule = require('../ImageModule').default;
  const { __state } = require('../ImageModule');

  beforeEach(() => {
    ImageModule.loadAsync.mockClear();
  });

  it('passes the host function request id through loadAsync', async () => {
    await Image.loadAsync('https://example.com/a.jpg');

    expect(ImageModule.loadAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: 'https://example.com/a.jpg',
        devToolsRequestId: 'from-host',
      }),
      undefined
    );
  });

  it('keeps a request id already recorded for the source', async () => {
    await Image.loadAsync({ uri: 'https://example.com/a.jpg', devToolsRequestId: 'preset' });

    expect(ImageModule.loadAsync).toHaveBeenCalledWith(
      expect.objectContaining({ devToolsRequestId: 'preset' }),
      undefined
    );
  });

  it('records a request id itself when the native host function is unavailable', async () => {
    __state.createLoadAsync = undefined;

    let loadAsync: typeof Image.loadAsync;
    jest.isolateModules(() => {
      loadAsync = require('../Image').Image.loadAsync;
    });

    await loadAsync!('https://example.com/a.jpg');

    expect(ImageModule.loadAsync).toHaveBeenCalledWith(
      expect.objectContaining({ devToolsRequestId: 'from-render' }),
      undefined
    );
  });

  it('falls back to the global network reporter when native cannot capture an id', async () => {
    __state.createLoadAsync = undefined;
    __state.captureDevToolsRequestId = undefined;
    globalThis.__NETWORK_REPORTER__ = { createDevToolsRequestId: () => 'from-global' };

    let loadAsync: typeof Image.loadAsync;
    jest.isolateModules(() => {
      loadAsync = require('../Image').Image.loadAsync;
    });

    try {
      await loadAsync!('https://example.com/a.jpg');
    } finally {
      globalThis.__NETWORK_REPORTER__ = undefined;
    }

    expect(ImageModule.loadAsync).toHaveBeenCalledWith(
      expect.objectContaining({ devToolsRequestId: 'from-global' }),
      undefined
    );
  });
});
