import { toPosixPath } from '../filePath';

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
