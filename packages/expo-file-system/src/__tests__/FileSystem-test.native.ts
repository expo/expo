import { File, Directory, Paths } from '../..';
import { __resetMockFileSystem } from '../../mocks/FileSystem';

beforeEach(() => {
  __resetMockFileSystem();
});

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
    expect(typeof file.copySync).toBe('function');
    expect(typeof file.move).toBe('function');
    expect(typeof file.moveSync).toBe('function');
    expect(typeof file.text).toBe('function');
    expect(typeof file.write).toBe('function');
  });

  it('Directory has inherited methods from native mock', () => {
    const dir = new Directory(Paths.document, 'subdir');
    expect(typeof dir.delete).toBe('function');
    expect(typeof dir.create).toBe('function');
    expect(typeof dir.copy).toBe('function');
    expect(typeof dir.copySync).toBe('function');
    expect(typeof dir.move).toBe('function');
    expect(typeof dir.moveSync).toBe('function');
  });

  it('File copy and move return promises', async () => {
    const file = new File(Paths.cache, 'test.txt');
    file.create();
    const destination = new File(Paths.cache, 'destination.txt');

    await expect(file.copy(destination)).resolves.toBeUndefined();
    await expect(file.move(destination, { overwrite: true })).resolves.toBeUndefined();
  });

  it('Directory copy and move return promises', async () => {
    const dir = new Directory(Paths.document, 'subdir');
    dir.create();
    const destination = new Directory(Paths.document, 'destination');
    destination.create();

    await expect(dir.copy(destination)).resolves.toBeUndefined();
    await expect(dir.move(destination, { overwrite: true })).resolves.toBeUndefined();
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

describe('expo-file-system behavioral mock', () => {
  it('seeds canonical directories so Paths.*.exists is true', () => {
    expect(Paths.cache.exists).toBe(true);
    expect(Paths.document.exists).toBe(true);
    expect(Paths.bundle.exists).toBe(true);
  });

  it('Directory.create flips exists from false to true', () => {
    const dir = new Directory(Paths.cache, 'new-dir');
    expect(dir.exists).toBe(false);
    dir.create();
    expect(dir.exists).toBe(true);
  });

  it('Directory.create throws when the directory already exists', () => {
    const dir = new Directory(Paths.cache, 'already-there');
    dir.create();
    expect(() => dir.create()).toThrow();
    expect(() => dir.create({ idempotent: true })).not.toThrow();
  });

  it('Directory.create({ intermediates }) creates missing ancestors', () => {
    const nested = new Directory(Paths.cache, 'a', 'b', 'c');
    expect(() => nested.create()).toThrow();
    nested.create({ intermediates: true });
    expect(nested.exists).toBe(true);
    expect(new Directory(Paths.cache, 'a').exists).toBe(true);
    expect(new Directory(Paths.cache, 'a', 'b').exists).toBe(true);
  });

  it('Directory.createFile returns a File that appears in list()', () => {
    const dir = new Directory(Paths.cache, 'listing');
    dir.create();
    const file = dir.createFile('hello.txt', null);
    expect(file).toBeInstanceOf(File);
    expect(file.exists).toBe(true);

    const children = dir.list();
    expect(children).toHaveLength(1);
    expect(children[0]).toBeInstanceOf(File);
    expect(children[0].uri).toBe(file.uri);
  });

  it('File.write(string) and File.text() roundtrip utf-8', async () => {
    const file = new File(Paths.cache, 'hello.txt');
    file.write('hello world');
    expect(file.textSync()).toBe('hello world');
    await expect(file.text()).resolves.toBe('hello world');
  });

  it('File.write(Uint8Array) and File.bytes() roundtrip byte-for-byte', async () => {
    const file = new File(Paths.cache, 'bin.dat');
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    file.write(payload);
    expect(Array.from(file.bytesSync())).toEqual([1, 2, 3, 4, 5]);
    await expect(file.bytes()).resolves.toEqual(payload);
  });

  it('File.write with append option appends to existing bytes', () => {
    const file = new File(Paths.cache, 'log.txt');
    file.write('a');
    file.write('b', { append: true });
    file.write('c', { append: true });
    expect(file.textSync()).toBe('abc');
  });

  it('File.write with base64 encoding decodes before storing', () => {
    const file = new File(Paths.cache, 'encoded.txt');
    file.write(Buffer.from('hello').toString('base64'), { encoding: 'base64' });
    expect(file.textSync()).toBe('hello');
  });

  it('File.move updates this.uri and removes the source', async () => {
    const source = new File(Paths.cache, 'source.txt');
    source.write('payload');
    const originalUri = source.uri;

    const destDir = new Directory(Paths.cache, 'moved');
    destDir.create();

    await source.move(destDir);

    expect(source.uri).not.toBe(originalUri);
    expect(source.uri).toContain('moved/source.txt');
    expect(source.exists).toBe(true);
    expect(source.textSync()).toBe('payload');

    const oldRef = new File(originalUri);
    expect(oldRef.exists).toBe(false);
  });

  it('File.copy leaves the source intact and copies contents', async () => {
    const source = new File(Paths.cache, 'copy-src.txt');
    source.write('original');

    const dest = new File(Paths.cache, 'copy-dest.txt');
    await source.copy(dest);

    expect(source.exists).toBe(true);
    expect(dest.exists).toBe(true);
    expect(dest.textSync()).toBe('original');

    // Writing to the copy must not mutate the source.
    dest.write('mutated');
    expect(source.textSync()).toBe('original');
    expect(dest.textSync()).toBe('mutated');
  });

  it('Directory.delete removes the directory and all descendants', () => {
    const dir = new Directory(Paths.cache, 'doomed');
    dir.create();
    dir.createFile('a.txt', null).write('a');
    const inner = dir.createDirectory('inner');
    inner.createFile('b.txt', null).write('b');

    dir.delete();

    expect(dir.exists).toBe(false);
    expect(new File(Paths.cache, 'doomed', 'a.txt').exists).toBe(false);
    expect(new Directory(Paths.cache, 'doomed', 'inner').exists).toBe(false);
    expect(new File(Paths.cache, 'doomed', 'inner', 'b.txt').exists).toBe(false);
  });

  it('File.delete throws when the file does not exist', () => {
    const file = new File(Paths.cache, 'missing.txt');
    expect(() => file.delete()).toThrow();
  });

  it('File.text throws when the file does not exist', async () => {
    const file = new File(Paths.cache, 'nope.txt');
    expect(() => file.textSync()).toThrow();
    await expect(file.text()).rejects.toBeInstanceOf(Error);
  });

  it('two File instances at the same URI share state via the live getter', () => {
    const a = new File(Paths.cache, 'shared.txt');
    const b = new File(Paths.cache, 'shared.txt');
    expect(a.exists).toBe(false);
    expect(b.exists).toBe(false);

    a.create();
    expect(a.exists).toBe(true);
    expect(b.exists).toBe(true);

    b.delete();
    expect(a.exists).toBe(false);
    expect(b.exists).toBe(false);
  });

  it('File.downloadFileAsync writes bytes to the destination', async () => {
    const destDir = new Directory(Paths.cache, 'downloads');
    destDir.create();
    const dest = new File(destDir, 'out.bin');

    const result = await File.downloadFileAsync('https://example.com/foo.bin', dest);
    expect(result).toBeInstanceOf(File);
    expect(result.uri).toContain('downloads/out.bin');
    expect(result.exists).toBe(true);
    expect(result.textSync()).toBe('mock:https://example.com/foo.bin');
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
