import process from 'node:process';

import { serializePath, toPosixPath } from '../filePath';

// Mock the `node:process` module to avoid overwriting the actual process module
jest.mock('node:process', () => ({
  platform: jest.requireActual('node:process').platform,
}));

// Reset the platform with the actual platform after each test
afterEach(() => {
  Object.defineProperty(process, 'platform', {
    value: jest.requireActual('node:process').platform,
  });
});

describe('linux', () => {
  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
  });

  describe(serializePath, () => {
    it('should serialize absolute paths with simple quotes', () => {
      expect(serializePath('/Users/expo/path/to/file.js')).toBe(`'/Users/expo/path/to/file.js'`);
      expect(serializePath('/Users/expo/node_modules/index.js')).toBe(
        `'/Users/expo/node_modules/index.js'`
      );
    });
  });

  describe(toPosixPath, () => {
    it('should not convert Unix to POSIX path on platforms other than Windows', () => {
      expect(toPosixPath('C:\\path\\to\\file')).toBe('C:\\path\\to\\file');
      expect(toPosixPath('/path/to/file')).toBe('/path/to/file');
    });
  });
});

describe('windows', () => {
  beforeEach(() => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
  });

  describe(serializePath, () => {
    it('should serialize and escape absolute paths', () => {
      expect(serializePath('C:\\Users\\expo\\path\\to\\file.js')).toBe(
        `"C:\\\\Users\\\\expo\\\\path\\\\to\\\\file.js"`
      );
      expect(serializePath('C:\\Users\\expo\\node_modules\\index.js')).toBe(
        `"C:\\\\Users\\\\expo\\\\node_modules\\\\index.js"`
      );
    });
  });

  describe(toPosixPath, () => {
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
