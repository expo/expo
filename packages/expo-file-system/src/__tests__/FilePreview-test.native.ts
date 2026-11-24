import { Platform } from 'react-native';

import { __resetMockFileSystem } from '../../mocks/FileSystem';
import ExpoFileSystem from '../ExpoFileSystem';
import { File, Paths } from '../index';

const originalPlatform = Platform.OS;

beforeEach(() => {
  __resetMockFileSystem();
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  jest.restoreAllMocks();
});

async function fixtures() {
  const files: [File, File] = [
    new File(Paths.cache, 'first.png'),
    new File(Paths.cache, 'second.pdf'),
  ];
  await Promise.all(files.map((file) => file.write('fixture')));
  return files;
}

function platform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

describe('static file previews', () => {
  it.each(['ios', 'android'] as const)('delegates singletons on %s', async (os) => {
    platform(os);
    const [file] = await fixtures();
    const canPreview = jest.spyOn(file, 'canPreview');
    const preview = jest.spyOn(file, 'preview');
    await expect(File.canPreview(file, { mimeType: 'image/png' })).resolves.toBe(true);
    await expect(File.canPreview([file])).resolves.toBe(true);
    await File.preview(file, { title: 'Image', mimeType: 'image/png' });
    await File.preview([file], { initialIndex: 0 });
    expect(canPreview).toHaveBeenCalledWith({ mimeType: 'image/png' });
    expect(preview).toHaveBeenCalledWith({ title: 'Image', mimeType: 'image/png' });
    expect(preview).toHaveBeenCalledTimes(2);
  });

  it('preserves ordering and the initial index on iOS', async () => {
    platform('ios');
    const files = (await fixtures()).reverse();
    const preview = jest.spyOn(ExpoFileSystem, 'preview');
    await expect(File.canPreview(files)).resolves.toBe(true);
    await File.preview(files);
    expect(preview).toHaveBeenLastCalledWith(files, 0);
    await File.preview(files, { initialIndex: 1 });
    expect(preview).toHaveBeenLastCalledWith(files, 1);
  });

  it('does not hand a collection to Android', async () => {
    platform('android');
    const files = await fixtures();
    const preview = jest.spyOn(ExpoFileSystem, 'preview');
    const canPreview = jest.spyOn(ExpoFileSystem, 'canPreview');
    await expect(File.canPreview(files)).resolves.toBe(false);
    await expect(File.preview(files)).rejects.toThrow();
    expect(preview).not.toHaveBeenCalled();
    expect(canPreview).not.toHaveBeenCalled();
  });

  it.each([[], null, undefined, {}, ['file:///image.png'], new Array(2)])(
    'rejects invalid input %#',
    async (input) => {
      await expect(File.canPreview(input as File[])).rejects.toThrow();
      await expect(File.preview(input as File[])).rejects.toThrow();
    }
  );

  it.each([-1, 2, 0.5, NaN, Infinity, -Infinity])(
    'rejects invalid index %s',
    async (initialIndex) => {
      const files = await fixtures();
      await expect(File.preview(files, { initialIndex })).rejects.toThrow(RangeError);
    }
  );

  it('rejects an invalid index for a singleton', async () => {
    const [file] = await fixtures();
    await expect(File.preview(file, { initialIndex: 1 })).rejects.toThrow(RangeError);
  });

  it('rejects single-file options for collections', async () => {
    const files = await fixtures();
    await expect(File.canPreview(files, { mimeType: 'image/png' })).rejects.toThrow(TypeError);
    await expect(File.preview(files, { title: 'One title' })).rejects.toThrow(TypeError);
  });

  it('does not mutate the input array', async () => {
    platform('ios');
    const files = await fixtures();
    const original = [...files];
    await File.preview(files, { initialIndex: 1 });
    expect(files).toEqual(original);
  });

  it('checks unavailable members and rejects the complete request', async () => {
    platform('ios');
    const files = await fixtures();
    files[1].delete();
    await expect(File.canPreview(files)).resolves.toBe(false);
    await expect(File.preview(files)).rejects.toThrow();
  });
});
