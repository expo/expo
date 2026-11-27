/**
 * @jest-environment jsdom
 */
class FakeSharedObject {
  emit() {}
  addListener() {}
  removeListener() {}
}

(globalThis as any).expo = { SharedObject: FakeSharedObject };

const { AudioPlaylistWeb } = require('../AudioPlaylist.web');

beforeEach(() => {
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('is loaded after a skip to a track that loaded during preload', () => {
  const playlist = new AudioPlaylistWeb(['https://example.com/1.mp3', 'https://example.com/2.mp3']);
  // The preloaded track fired `loadeddata` before it had handlers.
  jest
    .spyOn(HTMLMediaElement.prototype, 'readyState', 'get')
    .mockReturnValue(HTMLMediaElement.HAVE_ENOUGH_DATA);

  playlist.next();

  expect(playlist.isLoaded).toBe(true);
  expect(playlist.isBuffering).toBe(false);
});
