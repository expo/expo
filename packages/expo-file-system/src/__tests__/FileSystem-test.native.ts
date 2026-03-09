import { File, Directory, Paths } from 'expo-file-system';

describe('expo-file-system new API', () => {
  it('exports File, Directory, and Paths classes', () => {
    expect(File).toBeDefined();
    expect(Directory).toBeDefined();
    expect(Paths).toBeDefined();
  });

  it('Paths.document returns a Directory with a mock URI', () => {
    const doc = Paths.document;
    expect(doc).toBeDefined();
    expect(doc.uri).toBe('file:///mock/document/');
  });

  it('Paths.cache returns a Directory with a mock URI', () => {
    const cache = Paths.cache;
    expect(cache).toBeDefined();
    expect(cache.uri).toBe('file:///mock/cache/');
  });

  it('Paths.bundle returns a Directory with a mock URI', () => {
    const bundle = Paths.bundle;
    expect(bundle).toBeDefined();
    expect(bundle.uri).toBe('file:///mock/bundle/');
  });

  it('Paths.totalDiskSpace and availableDiskSpace return numbers', () => {
    expect(typeof Paths.totalDiskSpace).toBe('number');
    expect(typeof Paths.availableDiskSpace).toBe('number');
  });

  it('can construct a File from Paths.cache', () => {
    const file = new File(Paths.cache, 'test.txt');
    expect(file).toBeDefined();
    expect(file.uri).toContain('test.txt');
    expect(file.uri).toContain('mock/cache');
  });

  it('can construct a Directory from Paths.document', () => {
    const dir = new Directory(Paths.document, 'subdir');
    expect(dir).toBeDefined();
    expect(dir.uri).toContain('subdir');
    expect(dir.uri).toContain('mock/document');
  });

  it('File has inherited methods from native mock', () => {
    const file = new File(Paths.cache, 'test.txt');
    expect(typeof file.delete).toBe('function');
    expect(typeof file.create).toBe('function');
    expect(typeof file.copy).toBe('function');
    expect(typeof file.move).toBe('function');
    expect(typeof file.text).toBe('function');
    expect(typeof file.write).toBe('function');
  });

  it('Directory has inherited methods from native mock', () => {
    const dir = new Directory(Paths.document, 'subdir');
    expect(typeof dir.delete).toBe('function');
    expect(typeof dir.create).toBe('function');
    expect(typeof dir.copy).toBe('function');
    expect(typeof dir.move).toBe('function');
  });

  it('File.parentDirectory returns a Directory', () => {
    const file = new File(Paths.cache, 'subdir', 'test.txt');
    const parent = file.parentDirectory;
    expect(parent).toBeInstanceOf(Directory);
    expect(parent.uri).toContain('subdir');
  });

  it('File.name and File.extension work', () => {
    const file = new File(Paths.cache, 'test.txt');
    expect(file.name).toBe('test.txt');
    expect(file.extension).toBe('.txt');
  });
});

describe('expo-file-system/legacy mock', () => {
  it('legacy API functions are mocked', () => {
    const legacy = require('expo-file-system/legacy');
    expect(legacy.downloadAsync).toBeDefined();
    expect(legacy.getInfoAsync).toBeDefined();
    expect(legacy.readAsStringAsync).toBeDefined();
    expect(legacy.deleteAsync).toBeDefined();
    expect(typeof legacy.downloadAsync).toBe('function');
  });

  it('legacy mock functions return promises', async () => {
    const legacy = require('expo-file-system/legacy');
    const result = await legacy.downloadAsync();
    expect(result).toEqual({ md5: 'md5', uri: 'uri' });
  });
});
