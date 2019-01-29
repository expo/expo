import { mockPlatformWeb, mockProperty } from 'jest-expo';

import ExponentFileSystem from '../ExponentFileSystem';
import * as FileSystem from '../FileSystem';

describe('FileSystem', () => {
  describe('constants', () => {
    it('documentDirectory', () => expect(FileSystem.documentDirectory).toBeDefined());
    it('cacheDirectory', () => expect(FileSystem.cacheDirectory).toBeDefined());
    it('bundledAssets', () => expect(FileSystem.bundledAssets).toBeDefined());
    it('bundleDirectory', () => expect(FileSystem.bundleDirectory).toBeDefined());
  });

  describe('methods', () => {
    const URI = '/';
    const toURI = '/other';
    it('downloadAsync', () => {
      const props: any = ['foo', 'bar', {}];
      FileSystem.downloadAsync(props[0], props[1], props[2]);
      expect(ExponentFileSystem.downloadAsync).toHaveBeenCalledWith(...props);
    });

    it('getInfoAsync', async () => {
      await FileSystem.getInfoAsync(URI);
    });
    it('readAsStringAsync', async () => {
      await FileSystem.readAsStringAsync(URI);
    });
    it('writeAsStringAsync', async () => {
      await FileSystem.writeAsStringAsync(URI, 'bar');
    });
    it('deleteAsync', async () => {
      await FileSystem.deleteAsync(URI);
    });
    it('moveAsync', async () => {
      await FileSystem.moveAsync({ from: URI, to: toURI });
    });
    it('copyAsync', async () => {
      await FileSystem.copyAsync({ from: URI, to: toURI });
    });
    it('makeDirectoryAsync', async () => {
      await FileSystem.makeDirectoryAsync(URI);
    });
    it('readDirectoryAsync', async () => {
      await FileSystem.readDirectoryAsync(URI);
    });
    it('downloadAsync', async () => {
      await FileSystem.downloadAsync(URI, toURI);
    });
  });
});

function applyMocks() {
  mockPlatformWeb();
  [
    'getInfoAsync',
    'readAsStringAsync',
    'writeAsStringAsync',
    'deleteAsync',
    'moveAsync',
    'copyAsync',
    'makeDirectoryAsync',
    'readDirectoryAsync',
    'downloadAsync',
  ].forEach(methodName => {
    mockProperty(ExponentFileSystem, methodName, null);
  });
}
