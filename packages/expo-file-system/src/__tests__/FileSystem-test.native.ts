import { __resetMockFileSystem } from '../../mocks/FileSystem';
import { FileMode } from '../File.types';
import { DownloadTask, File, Directory, Paths, UploadTask, FileSlice } from '../index';

beforeEach(() => {
  __resetMockFileSystem();
});

describe('expo-file-system new API', () => {
  it('exports File, Directory, Paths, and network task classes', () => {
    expect(File).toBeDefined();
    expect(Directory).toBeDefined();
    expect(Paths).toBeDefined();
    expect(UploadTask).toBeDefined();
    expect(DownloadTask).toBeDefined();
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
    expect(typeof file.writeSync).toBe('function');
    expect(typeof file.json).toBe('function');
    expect(typeof file.formData).toBe('function');
    expect(typeof file.canPreview).toBe('function');
    expect(typeof file.preview).toBe('function');
  });

  it('File.json parses file text', async () => {
    const file = new File(Paths.cache, 'test.json');

    jest.spyOn(file, 'text').mockResolvedValue('{"hello":"world"}');

    await expect(file.json()).resolves.toEqual({ hello: 'world' });
  });

  it('File.formData parses from file bytes', async () => {
    const originalResponse = global.Response;
    const formData = new FormData();
    const buffer = new ArrayBuffer(3);
    const response = {
      formData: jest.fn().mockResolvedValue(formData),
    };
    const ResponseMock = jest.fn().mockReturnValue(response);
    const file = new File(Paths.cache, 'form-data.txt');

    jest.spyOn(file, 'arrayBuffer').mockResolvedValue(buffer);
    Object.defineProperty(file, 'type', {
      configurable: true,
      get: () => 'multipart/form-data; boundary=test',
    });
    global.Response = ResponseMock as unknown as typeof Response;

    try {
      await expect(file.formData()).resolves.toBe(formData);
    } finally {
      global.Response = originalResponse;
    }

    expect(ResponseMock).toHaveBeenCalledWith(buffer, {
      headers: { 'Content-Type': 'multipart/form-data; boundary=test' },
    });
    expect(response.formData).toHaveBeenCalledTimes(1);
  });

  it('File.canPreview reflects mock file existence', async () => {
    const file = new File(Paths.cache, 'preview.pdf');

    await expect(file.canPreview()).resolves.toBe(false);

    await file.write('mock pdf');

    await expect(file.canPreview()).resolves.toBe(true);
  });

  it('File.preview rejects when mock file does not exist', async () => {
    const file = new File(Paths.cache, 'missing.pdf');

    await expect(file.preview()).rejects.toThrow('File does not exist');
  });

  it('File.preview resolves when mock file exists', async () => {
    const file = new File(Paths.cache, 'existing-preview.pdf');
    await file.write('mock pdf');

    await expect(file.preview()).resolves.toBeUndefined();
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

  it('File.write returns a promise and File.writeSync stays synchronous', async () => {
    const file = new File(Paths.cache, 'test.txt');

    expect(file.write('hello')).toBeInstanceOf(Promise);
    const result = await file.write('hello');
    expect(result).toBeUndefined();
    expect(file.writeSync('hello')).toBeUndefined();
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
    expect(children[0]!.uri).toBe(file.uri);
  });

  it('Directory.info returns child names, size, and deterministic metadata', () => {
    const dir = new Directory(Paths.cache, 'info-dir');
    dir.create();
    const creationTime = dir.info().creationTime;
    dir.createFile('a.txt', null).writeSync('abc');
    dir.createFile('b.txt', null).writeSync('de');

    expect(dir.info()).toMatchObject({
      exists: true,
      files: ['a.txt', 'b.txt'],
      size: 5,
      creationTime,
    });
  });

  it('File.writeSync(string) and File.text() roundtrip utf-8', async () => {
    const file = new File(Paths.cache, 'hello.txt');
    file.writeSync('hello world');
    expect(file.textSync()).toBe('hello world');
    await expect(file.text()).resolves.toBe('hello world');
  });

  it('File.write(string) and File.text() roundtrip utf-8', async () => {
    const file = new File(Paths.cache, 'hello_async.txt');
    await file.write('hello world');
    expect(file.textSync()).toBe('hello world');
    await expect(file.text()).resolves.toBe('hello world');
  });

  it('File.writeSync(Uint8Array) and File.bytes() roundtrip byte-for-byte', async () => {
    const file = new File(Paths.cache, 'bin.dat');
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    file.writeSync(payload);
    expect(Array.from(file.bytesSync())).toEqual([1, 2, 3, 4, 5]);
    await expect(file.bytes()).resolves.toEqual(payload);
  });

  it('File.writeSync(ArrayBuffer) and File.bytes() roundtrip byte-for-byte', async () => {
    const file = new File(Paths.cache, 'bin-buffer.dat');
    const payload = Uint8Array.from([6, 7, 8, 9]).buffer;
    file.writeSync(payload);
    expect(Array.from(file.bytesSync())).toEqual([6, 7, 8, 9]);
    await expect(file.bytes()).resolves.toEqual(new Uint8Array(payload));
  });

  it('File.writeSync with append option appends to existing bytes', () => {
    const file = new File(Paths.cache, 'log.txt');
    file.writeSync('a');
    file.writeSync('b', { append: true });
    file.writeSync('c', { append: true });
    expect(file.textSync()).toBe('abc');
  });

  it('File.write with append option appends to existing bytes', async () => {
    const file = new File(Paths.cache, 'log_async.txt');
    await file.write('a');
    await file.write('b', { append: true });
    await file.write('c', { append: true });
    expect(file.textSync()).toBe('abc');
  });

  it('File.writeSync with base64 encoding decodes before storing', () => {
    const file = new File(Paths.cache, 'encoded.txt');
    file.writeSync(Buffer.from('hello').toString('base64'), { encoding: 'base64' });
    expect(file.textSync()).toBe('hello');
  });

  it('File.write with base64 encoding decodes before storing', async () => {
    const file = new File(Paths.cache, 'encoded_async.txt');
    await file.write(Buffer.from('hello').toString('base64'), { encoding: 'base64' });
    expect(file.textSync()).toBe('hello');
  });

  it('File metadata uses deterministic timestamps that reset with the mock filesystem', () => {
    const file = new File(Paths.cache, 'metadata.txt');
    expect(file.size).toBe(0);
    expect(file.type).toBe('');
    expect(file.modificationTime).toBeNull();
    expect(file.lastModified).toBeNull();
    expect(file.creationTime).toBeNull();

    file.create();
    const creationTime = file.creationTime;
    expect(creationTime).toEqual(expect.any(Number));
    expect(creationTime).toBeGreaterThan(0);
    expect(file.modificationTime).toBe(creationTime);

    file.writeSync('hello');
    expect(file.size).toBe(5);
    expect(file.creationTime).toBe(creationTime);
    expect(file.modificationTime).toBeGreaterThan(creationTime!);
    expect(file.lastModified).toBe(file.modificationTime);
    expect(file.info()).toMatchObject({
      size: 5,
      creationTime,
      modificationTime: file.modificationTime,
    });

    __resetMockFileSystem();
    const resetFile = new File(Paths.cache, 'metadata.txt');
    resetFile.create();
    expect(resetFile.creationTime).toBe(creationTime);
  });

  it('File.move updates this.uri and removes the source', async () => {
    const source = new File(Paths.cache, 'source.txt');
    source.writeSync('payload');
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
    source.writeSync('original');

    const dest = new File(Paths.cache, 'copy-dest.txt');
    await source.copy(dest);

    expect(source.exists).toBe(true);
    expect(dest.exists).toBe(true);
    expect(dest.textSync()).toBe('original');

    // Writing to the copy must not mutate the source.
    dest.writeSync('mutated');
    expect(source.textSync()).toBe('original');
    expect(dest.textSync()).toBe('mutated');
  });

  it('Directory.delete removes the directory and all descendants', () => {
    const dir = new Directory(Paths.cache, 'doomed');
    dir.create();
    dir.createFile('a.txt', null).writeSync('a');
    const inner = dir.createDirectory('inner');
    inner.createFile('b.txt', null).writeSync('b');

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

  describe('FileMode handling', () => {
    function encode(contents: string): Uint8Array {
      return new TextEncoder().encode(contents);
    }

    function makeFile(name: string, contents = 'hello'): File {
      const file = new File(Paths.cache, name);
      file.create();
      file.writeSync(contents);
      return file;
    }

    it('FileMode.ReadOnly rejects writes', () => {
      const file = makeFile('readonly.txt');
      const handle = file.open(FileMode.ReadOnly);
      expect(() => handle.writeBytesSync(new Uint8Array([1, 2, 3]))).toThrow();
      handle.close();
    });

    it('FileMode.WriteOnly rejects reads', () => {
      const file = makeFile('writeonly.txt');
      const handle = file.open(FileMode.WriteOnly);
      expect(() => handle.readBytesSync(1)).toThrow();
      handle.close();
    });

    it('FileMode.Append positions the cursor at end of file', () => {
      const file = makeFile('append.txt', 'abc');
      const handle = file.open(FileMode.Append);
      handle.writeBytesSync(encode('def'));
      handle.close();
      expect(file.textSync()).toBe('abcdef');
    });

    it('FileMode.Truncate wipes existing contents on open', () => {
      const file = makeFile('truncate.txt', 'will-be-wiped');
      const handle = file.open(FileMode.Truncate);
      handle.writeBytesSync(encode('fresh'));
      handle.close();
      expect(file.textSync()).toBe('fresh');
    });

    it('preserves the stored mime type across write() and Truncate opens', () => {
      const dir = new Directory(Paths.cache, 'typed');
      dir.create();
      const file = dir.createFile('x.txt', 'text/plain');
      expect(file.type).toBe('text/plain');

      file.writeSync('hello');
      expect(file.type).toBe('text/plain');

      const handle = file.open(FileMode.Truncate);
      handle.writeBytesSync(encode('fresh'));
      handle.close();
      expect(file.type).toBe('text/plain');
    });

    it('FileMode.ReadWrite is the default and allows both', () => {
      const file = makeFile('rw.txt', 'seed');
      const handle = file.open();
      expect(handle.readBytesSync(4)).toEqual(encode('seed'));
      handle.writeBytesSync(encode('!'));
      handle.close();
      expect(file.textSync()).toBe('seed!');
    });

    it('tracks offset and size while the handle is open', () => {
      const file = makeFile('handle-metadata.txt', 'abc');
      const handle = file.open(FileMode.ReadOnly);
      expect(handle.offset).toBe(0);
      expect(handle.size).toBe(3);
      handle.readBytesSync(2);
      expect(handle.offset).toBe(2);
      handle.close();
      expect(handle.offset).toBeNull();
      expect(handle.size).toBeNull();
    });

    it('honors offset writes and appends when offset is past the file size', () => {
      const file = makeFile('offset-writes.txt', 'abcd');
      const handle = file.open(FileMode.ReadWrite);
      handle.offset = 1;
      handle.writeBytesSync(encode('Z'));
      expect(handle.offset).toBe(2);
      handle.offset = 99;
      handle.writeBytesSync(encode('!'));
      handle.close();
      expect(file.textSync()).toBe('aZcd!');
    });
  });
});

describe('File.slice() / FileSlice', () => {
  function makeFile(name: string, contents: string): File {
    const file = new File(Paths.cache, name);
    file.create();
    file.writeSync(contents);
    return file;
  }

  it('File.slice() returns a FileSlice, not a Blob with materialized data', () => {
    const file = makeFile('slice-type.txt', 'hello world');
    const slice = file.slice(0, 5);
    expect(slice).toBeInstanceOf(FileSlice);
    expect(slice.size).toBe(5);
  });

  it('slice reads only the requested byte range', async () => {
    const file = makeFile('range.txt', 'abcdefghij');
    const slice = file.slice(2, 7);
    expect(slice.size).toBe(5);
    await expect(slice.text()).resolves.toBe('cdefg');
  });

  it('slice.bytes() returns the correct Uint8Array', async () => {
    const file = makeFile('bytes.txt', 'hello');
    const slice = file.slice(1, 4);
    const bytes = await slice.bytes();
    expect(Array.from(bytes)).toEqual([101, 108, 108]); // 'ell'
  });

  it('slice.arrayBuffer() returns an ArrayBuffer of the correct length', async () => {
    const file = makeFile('ab.txt', 'hello world');
    const slice = file.slice(0, 5);
    const ab = await slice.arrayBuffer();
    expect(ab.byteLength).toBe(5);
    expect(new TextDecoder().decode(ab)).toBe('hello');
  });

  it('handles negative start offset (relative to end)', async () => {
    const file = makeFile('neg-start.txt', 'abcdefghij');
    const slice = file.slice(-3);
    expect(slice.size).toBe(3);
    await expect(slice.text()).resolves.toBe('hij');
  });

  it('handles negative end offset', async () => {
    const file = makeFile('neg-end.txt', 'abcdefghij');
    const slice = file.slice(2, -2);
    expect(slice.size).toBe(6);
    await expect(slice.text()).resolves.toBe('cdefgh');
  });

  it('returns empty data when start >= end', async () => {
    const file = makeFile('empty-range.txt', 'hello');
    const slice = file.slice(3, 1);
    expect(slice.size).toBe(0);
    await expect(slice.text()).resolves.toBe('');
    const ab = await slice.arrayBuffer();
    expect(ab.byteLength).toBe(0);
  });

  it('clamps start and end to file size', async () => {
    const file = makeFile('clamp.txt', 'abc');
    const slice = file.slice(0, 100);
    expect(slice.size).toBe(3);
    await expect(slice.text()).resolves.toBe('abc');
  });

  it('slice with no arguments returns full file range', async () => {
    const file = makeFile('full.txt', 'full content');
    const slice = file.slice();
    expect(slice.size).toBe(12);
    await expect(slice.text()).resolves.toBe('full content');
  });

  it('preserves contentType from File when not overridden', () => {
    const dir = new Directory(Paths.cache, 'typed-slice');
    dir.create();
    const file = dir.createFile('data.json', 'application/json') as unknown as File;
    file.writeSync('{"key":"value"}');

    const slice = new File(file.uri).slice(0, 5);
    expect(slice.type).toBeDefined();
  });

  it('overrides contentType when provided', () => {
    const file = makeFile('override.txt', 'hello');
    const slice = file.slice(0, 5, 'text/plain');
    expect(slice.type).toBe('text/plain');
  });

  describe('nested slices', () => {
    it('slice of a slice composes offsets correctly', async () => {
      const file = makeFile('nested.txt', 'abcdefghij');
      // First slice: bytes 2..8 -> "cdefgh"
      const outer = file.slice(2, 8);
      expect(outer.size).toBe(6);
      // Nested slice: bytes 1..4 of the outer -> "def"
      const inner = outer.slice(1, 4);
      expect(inner.size).toBe(3);
      await expect(inner.text()).resolves.toBe('def');
    });

    it('deeply nested slices compose correctly', async () => {
      const file = makeFile('deep.txt', '0123456789');
      const s1 = file.slice(1, 9); // "12345678"
      const s2 = s1.slice(1, 7); // "234567"
      const s3 = s2.slice(1, 5); // "3456"
      const s4 = s3.slice(1, 3); // "45"
      expect(s4.size).toBe(2);
      await expect(s4.text()).resolves.toBe('45');
    });

    it('nested slice with negative offsets', async () => {
      const file = makeFile('nested-neg.txt', 'abcdefghij');
      const outer = file.slice(2, 8); // "cdefgh"
      const inner = outer.slice(-3); // "fgh"
      expect(inner.size).toBe(3);
      await expect(inner.text()).resolves.toBe('fgh');
    });
  });

  describe('stream()', () => {
    it('streams the slice content in chunks', async () => {
      const file = makeFile('stream.txt', 'the quick brown fox');
      const slice = file.slice(4, 9); // "quick"
      const reader = slice.stream().getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        all.set(chunk, offset);
        offset += chunk.length;
      }
      expect(new TextDecoder().decode(all)).toBe('quick');
    });

    it('empty slice stream closes immediately', async () => {
      const file = makeFile('empty-stream.txt', 'hello');
      const slice = file.slice(3, 1); // empty
      const reader = slice.stream().getReader();
      const { done } = await reader.read();
      expect(done).toBe(true);
    });
  });

  it('concurrent reads from different slices are independent', async () => {
    const file = makeFile('concurrent.txt', 'abcdefghij');
    const s1 = file.slice(0, 5);
    const s2 = file.slice(5, 10);
    const [t1, t2] = await Promise.all([s1.text(), s2.text()]);
    expect(t1).toBe('abcde');
    expect(t2).toBe('fghij');
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
