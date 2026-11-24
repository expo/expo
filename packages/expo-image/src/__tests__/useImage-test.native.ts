import { act, renderHook } from '@testing-library/react-native';

import { Image } from '../Image';
import type { ImageRef } from '../Image.types';
import { useImage } from '../useImage';
import { captureDevToolsRequestId } from '../utils/captureDevToolsRequestId';

jest.mock('../Image', () => ({ Image: { loadAsync: jest.fn() } }));
jest.mock('../utils/captureDevToolsRequestId', () => ({ captureDevToolsRequestId: jest.fn() }));

function createImageLoad() {
  const image = { release: jest.fn() } as unknown as ImageRef;
  const { promise, resolve } = Promise.withResolvers<ImageRef>();
  return { image, promise, finish: () => resolve(image) };
}

afterEach(() => jest.resetAllMocks());

it('releases the loaded image on unmount', async () => {
  const load = createImageLoad();
  jest.mocked(Image.loadAsync).mockReturnValueOnce(load.promise);
  const { result, unmount } = await renderHook(() => useImage('first.jpg'));

  await act(async () => load.finish());
  expect(result.current).toBe(load.image);
  expect(load.image.release).not.toHaveBeenCalled();

  await unmount();
  expect(load.image.release).toHaveBeenCalledTimes(1);
});

it('releases an image that finishes loading after unmount', async () => {
  const load = createImageLoad();
  jest.mocked(Image.loadAsync).mockReturnValueOnce(load.promise);
  const { unmount } = await renderHook(() => useImage('first.jpg'));

  await unmount();
  expect(load.image.release).not.toHaveBeenCalled();
  await act(async () => load.finish());
  expect(load.image.release).toHaveBeenCalledTimes(1);
});

it('releases each loaded image after the next image replaces it or on unmount', async () => {
  const first = createImageLoad();
  const second = createImageLoad();
  jest
    .mocked(Image.loadAsync)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const { result, rerender, unmount } = await renderHook<ImageRef | null, { uri: string }>(
    ({ uri }) => useImage(uri),
    {
      initialProps: { uri: 'first.jpg' },
    }
  );

  await act(async () => first.finish());
  await rerender({ uri: 'second.jpg' });
  expect(result.current).toBe(first.image);
  expect(first.image.release).not.toHaveBeenCalled();

  await act(async () => second.finish());
  expect(result.current).toBe(second.image);
  expect(first.image.release).toHaveBeenCalledTimes(1);
  expect(second.image.release).not.toHaveBeenCalled();
  await unmount();
  expect(first.image.release).toHaveBeenCalledTimes(1);
  expect(second.image.release).toHaveBeenCalledTimes(1);
});

it('releases a stale load without replacing the current image', async () => {
  const first = createImageLoad();
  const second = createImageLoad();
  jest
    .mocked(Image.loadAsync)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const { result, rerender, unmount } = await renderHook<ImageRef | null, { uri: string }>(
    ({ uri }) => useImage(uri),
    {
      initialProps: { uri: 'first.jpg' },
    }
  );

  await rerender({ uri: 'second.jpg' });
  await act(async () => second.finish());
  await act(async () => first.finish());
  expect(result.current).toBe(second.image);
  expect(first.image.release).toHaveBeenCalledTimes(1);
  expect(second.image.release).not.toHaveBeenCalled();
  await unmount();
  expect(second.image.release).toHaveBeenCalledTimes(1);
});

test('passes the request id captured during render to the first load only', async () => {
  jest.mocked(captureDevToolsRequestId).mockReturnValueOnce('from-render');
  jest.mocked(Image.loadAsync).mockRejectedValueOnce(new Error('offline'));
  let retry: (() => void) | undefined;
  await renderHook(() =>
    useImage('https://example.com/a.jpg', {
      onError: (_, retryLoad) => {
        retry = retryLoad;
      },
    })
  );
  await act(async () => {});

  jest.mocked(Image.loadAsync).mockReturnValueOnce(createImageLoad().promise);
  await act(async () => retry?.());

  expect(jest.mocked(Image.loadAsync).mock.calls.map(([source]) => source)).toEqual([
    { uri: 'https://example.com/a.jpg', devToolsRequestId: 'from-render' },
    { uri: 'https://example.com/a.jpg' },
  ]);
});

test('captures a new request id during render when a dependency changes', async () => {
  jest
    .mocked(captureDevToolsRequestId)
    .mockReturnValueOnce('first-render')
    .mockReturnValueOnce('dependency-change');
  jest
    .mocked(Image.loadAsync)
    .mockReturnValueOnce(createImageLoad().promise)
    .mockReturnValueOnce(createImageLoad().promise);
  const { rerender } = await renderHook<ImageRef | null, { version: number }>(
    ({ version }) => useImage('https://example.com/a.jpg', {}, [version]),
    { initialProps: { version: 1 } }
  );

  await rerender({ version: 2 });

  expect(jest.mocked(Image.loadAsync).mock.calls.map(([source]) => source)).toEqual([
    { uri: 'https://example.com/a.jpg', devToolsRequestId: 'first-render' },
    { uri: 'https://example.com/a.jpg', devToolsRequestId: 'dependency-change' },
  ]);
});
