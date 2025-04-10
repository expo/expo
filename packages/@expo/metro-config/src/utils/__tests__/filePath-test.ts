import process from 'node:process';

import { toPosixPath } from '../filePath';

jest.mock('node:process', () => ({
  platform: jest.requireActual('node:process').platform,
}));

describe(toPosixPath, () => {
  const platform = process.platform;

  describe('linux', () => {
    // Make the test think we are running on Linux
    beforeAll(() => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
    });
    afterAll(() => {
      Object.defineProperty(process, 'platform', { value: platform });
    });

    it('should not convert Unix to POSIX path on platforms other than Windows', () => {
      expect(toPosixPath('C:\\path\\to\\file')).toBe('C:\\path\\to\\file');
      expect(toPosixPath('/path/to/file')).toBe('/path/to/file');
    });
  });

  describe('windows', () => {
    // Make the test think we are running on Windows
    beforeAll(() => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
    });
    afterAll(() => {
      Object.defineProperty(process, 'platform', { value: platform });
    });

    it('should convert an Unix path to a POSIX path', () => {
      expect(toPosixPath('/path/to/file')).toBe('/path/to/file');
    });

    it('should convert a Windows path to a POSIX path', () => {
      expect(toPosixPath('C:\\path\\to\\file')).toBe('C:/path/to/file');
    });

    it('should convert a WSL path to a POSIX path', () => {
      expect(toPosixPath('/mnt/c/path/to/file')).toBe('/mnt/c/path/to/file');
    });

    it('should handle converted paths', () => {
      expect(toPosixPath('C:/path/to/file')).toBe('C:/path/to/file');
    });
  });
});
