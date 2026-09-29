import { act, renderHook } from '@testing-library/react-native';

import { Image } from '../Image';
import type { ImageRef } from '../Image.types';
import { useImage } from '../useImage';

jest.mock('../Image', () => ({ Image: { loadAsync: jest.fn() } }));

function createImageLoad() {
  const image = { release: jest.fn() } as unknown as ImageRef;
  const { promise, resolve } = Promise.withResolvers<ImageRef>();
  return { image, promise, finish: () => resolve(image) };
}

afterEach(() => jest.resetAllMocks());

it('releases the loaded image on unmount', async () => {
  const load = createImageLoad();
  jest.mocked(Image.loadAsync).mockReturnValueOnce(load.promise);
  const { result, unmount } = renderHook(() => useImage('first.jpg'));

  await act(async () => load.finish());
  expect(result.current).toBe(load.image);
  expect(load.image.release).not.toHaveBeenCalled();

  unmount();
  expect(load.image.release).toHaveBeenCalledTimes(1);
});

it('releases an image that finishes loading after unmount', async () => {
  const load = createImageLoad();
  jest.mocked(Image.loadAsync).mockReturnValueOnce(load.promise);
  const { unmount } = renderHook(() => useImage('first.jpg'));

  unmount();
  expect(load.image.release).not.toHaveBeenCalled();
  await act(async () => load.finish());
  expect(load.image.release).toHaveBeenCalledTimes(1);
});

it('releases each loaded image when its source is replaced or unmounted', async () => {
  const first = createImageLoad();
  const second = createImageLoad();
  jest
    .mocked(Image.loadAsync)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const { result, rerender, unmount } = renderHook<ImageRef | null, { uri: string }>(
    ({ uri }) => useImage(uri),
    {
      initialProps: { uri: 'first.jpg' },
    }
  );

  await act(async () => first.finish());
  rerender({ uri: 'second.jpg' });
  expect(first.image.release).toHaveBeenCalledTimes(1);

  await act(async () => second.finish());
  expect(result.current).toBe(second.image);
  expect(second.image.release).not.toHaveBeenCalled();
  unmount();
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
  const { result, rerender, unmount } = renderHook<ImageRef | null, { uri: string }>(
    ({ uri }) => useImage(uri),
    {
      initialProps: { uri: 'first.jpg' },
    }
  );

  rerender({ uri: 'second.jpg' });
  await act(async () => second.finish());
  await act(async () => first.finish());
  expect(result.current).toBe(second.image);
  expect(first.image.release).toHaveBeenCalledTimes(1);
  expect(second.image.release).not.toHaveBeenCalled();
  unmount();
  expect(second.image.release).toHaveBeenCalledTimes(1);
});
