import { __resetMockFileSystem } from '../../mocks/FileSystem';
import { FileMode } from '../File.types';
import { DownloadTask, File, Directory, Paths, UploadTask } from '../index';

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
    expect(typeof file.digest).toBe('function');
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

  it('File.digest supports the documented algorithms with lowercase hexadecimal output', async () => {
    const file = new File(Paths.cache, 'digest.txt');
    file.writeSync('hello');

    await expect(file.digest('MD5')).resolves.toBe(file.md5);
    const algorithms = [
      ['MD5', 32],
      ['SHA-1', 40],
      ['SHA-256', 64],
      ['SHA-384', 96],
      ['SHA-512', 128],
    ] as const;
    for (const [algorithm, hexLength] of algorithms) {
      await expect(file.digest(algorithm)).resolves.toMatch(new RegExp(`^[0-9a-f]{${hexLength}}$`));
    }
  });

  it('File.digest rejects when the file does not exist', async () => {
    const file = new File(Paths.cache, 'missing-digest.txt');

    await expect(file.digest('MD5')).rejects.toThrow('File does not exist');
  });

  it('File.digest rejects when the path points to a directory', async () => {
    const directory = new Directory(Paths.cache, 'digest-directory');
    directory.create();
    const file = new File(directory.uri);

    await expect(file.digest('MD5')).rejects.toThrow(
      'A folder with the same name already exists in the file location'
    );
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

    it('advances offset by the bytes actually read at the end of the file', () => {
      const file = makeFile('short-read.txt', 'abcde');
      const handle = file.open();
      handle.offset = 3;
      expect(handle.readBytesSync(10)).toEqual(encode('de'));
      expect(handle.offset).toBe(5);
      expect(handle.readBytesSync(1)).toEqual(new Uint8Array([]));
      expect(handle.offset).toBe(5);
      handle.close();
    });

    it('keeps offset unchanged after a failed write', () => {
      const file = makeFile('failed-write.txt', 'abcde');
      const handle = file.open(FileMode.ReadOnly);
      handle.readBytesSync(2);
      expect(() => handle.writeBytesSync(encode('A'))).toThrow();
      expect(handle.offset).toBe(2);
      handle.close();
    });

    it('reports size while open in Truncate mode', () => {
      const file = makeFile('truncate-size.txt', 'Old content');
      const handle = file.open(FileMode.Truncate);
      expect(handle.size).toBe(0);
      handle.writeBytesSync(encode('New'));
      expect(handle.size).toBe(3);
      expect(handle.offset).toBe(3);
      handle.close();
    });

    it('starts at the end of the file in Append mode', () => {
      const file = makeFile('append-offset.txt', 'Hello');
      const handle = file.open(FileMode.Append);
      expect(handle.offset).toBe(5);
      handle.writeBytesSync(encode('!'));
      expect(handle.offset).toBe(6);
      expect(handle.size).toBe(6);
      handle.close();
      expect(file.textSync()).toBe('Hello!');
    });

    it('reads nothing from an offset past the end of the file', () => {
      const file = makeFile('past-eof.txt', 'abc');
      const handle = file.open();
      handle.offset = 100;
      expect(handle.readBytesSync(2)).toEqual(new Uint8Array([]));
      expect(handle.offset).toBe(100);
      handle.close();
    });

    it('reports the new offset and size after an async write', async () => {
      const file = makeFile('write-race.txt', '');
      const handle = file.open();
      const payload = new Uint8Array(64 * 1024).fill(120);
      const pending = handle.writeBytes(payload);
      expect(typeof handle.size).toBe('number');
      await pending;
      expect(handle.offset).toBe(payload.length);
      expect(handle.size).toBe(payload.length);
      handle.close();
      expect(file.size).toBe(payload.length);
    });

    it('writes at the offset and zero-fills the gap when the offset is past the file size', () => {
      const file = makeFile('offset-writes.txt', 'abcd');
      const handle = file.open(FileMode.ReadWrite);
      handle.offset = 1;
      handle.writeBytesSync(encode('Z'));
      expect(handle.offset).toBe(2);
      handle.offset = 99;
      handle.writeBytesSync(encode('!'));
      expect(handle.offset).toBe(100);
      handle.close();
      const bytes = file.bytesSync();
      expect(bytes.length).toBe(100);
      expect(bytes.slice(0, 4)).toEqual(encode('aZcd'));
      expect(bytes.slice(4, 99)).toEqual(new Uint8Array(95));
      expect(bytes[99]).toBe(33); // '!'
    });

    describe('FileHandle cursor', () => {
      it('runs concurrent async reads in call order', async () => {
        const file = makeFile('ordered.txt', 'abcdef');
        const handle = file.open();
        const [first, second] = await Promise.all([handle.readBytes(2), handle.readBytes(2)]);
        expect(first).toEqual(encode('ab'));
        expect(second).toEqual(encode('cd'));
        expect(handle.offset).toBe(4);
        handle.close();
      });

      it('uses the offset assigned before an awaited async read', async () => {
        const file = makeFile('seek-async.txt', 'abcdef');
        const handle = file.open();
        handle.offset = 4;
        expect(await handle.readBytes(2)).toEqual(encode('ef'));
        expect(handle.offset).toBe(6);
        handle.close();
      });

      it('lets a pending async read finish when close() is called before it settles', async () => {
        const file = makeFile('close-race.txt', 'abcdef');
        const handle = file.open();
        const pending = handle.readBytes(3);
        handle.close();
        expect(handle.offset).toBeNull();
        expect(await pending).toEqual(encode('abc'));
        expect(handle.size).toBeNull();
        expect(() => handle.readBytesSync(1)).toThrow();
        await expect(handle.readBytes(1)).rejects.toThrow();
      });

      it('ignores a null offset assignment', () => {
        const file = makeFile('null-offset.txt', 'abc');
        const handle = file.open();
        handle.readBytesSync(1);
        handle.offset = null;
        expect(handle.offset).toBe(1);
        handle.close();
      });

      describe('FileHandle positional calls', () => {
        it('reads at a position without moving the offset', async () => {
          const file = makeFile('at-read.txt', 'abcdef');
          const handle = file.open(FileMode.ReadOnly);
          handle.readBytesSync(1);
          expect(handle.readBytesSync(2, { at: 4 })).toEqual(encode('ef'));
          expect(await handle.readBytes(2, { at: 2 })).toEqual(encode('cd'));
          expect(handle.readBytesSync(3, { at: 5 })).toEqual(encode('f'));
          expect(handle.readBytesSync(1, { at: 9 })).toEqual(new Uint8Array([]));
          expect(handle.offset).toBe(1);
          handle.close();
        });

        it('runs positional async reads without the queue, in any order', async () => {
          const file = makeFile('at-concurrent.txt', 'abcdef');
          const handle = file.open(FileMode.ReadOnly);
          const second = handle.readBytes(2, { at: 2 });
          const first = handle.readBytes(2, { at: 0 });
          expect(await second).toEqual(encode('cd'));
          expect(await first).toEqual(encode('ab'));
          expect(handle.offset).toBe(0);
          handle.close();
        });

        it('writes at a position without moving the offset and zero-fills a gap', async () => {
          const file = makeFile('at-write.txt', 'abcd');
          const handle = file.open(FileMode.ReadWrite);
          handle.writeBytesSync(encode('Z'), { at: 1 });
          await handle.writeBytes(encode('!'), { at: 6 });
          expect(handle.offset).toBe(0);
          handle.close();
          const bytes = file.bytesSync();
          expect(bytes).toEqual(new Uint8Array([...encode('aZcd'), 0, 0, 33]));
        });

        it('keeps positional writes in call order with cursor writes', async () => {
          const file = makeFile('at-write-order.txt', '');
          const handle = file.open(FileMode.ReadWrite);
          const cursorWrite = handle.writeBytes(encode('ab'));
          const atWrite = handle.writeBytes(encode('X'), { at: 0 });
          await Promise.all([cursorWrite, atWrite]);
          expect(handle.offset).toBe(2);
          handle.close();
          expect(file.textSync()).toBe('Xb');
        });

        it('appends a positional write in Append mode and leaves the offset alone', () => {
          const file = makeFile('at-append.txt', 'abc');
          const handle = file.open(FileMode.Append);
          handle.writeBytesSync(encode('d'), { at: 0 });
          expect(handle.offset).toBe(3);
          expect(handle.size).toBe(4);
          handle.writeBytesSync(encode('e'));
          expect(handle.offset).toBe(5);
          handle.close();
          expect(file.textSync()).toBe('abcde');
        });

        it('waits for an un-queued positional read before closing the native handle', async () => {
          const file = makeFile('at-close.txt', 'abcdef');
          const handle = file.open(FileMode.ReadOnly);
          const native = (handle as any).native;
          let resolveRead!: (bytes: ArrayBuffer) => void;
          jest.spyOn(native, 'readAt').mockImplementationOnce(
            () =>
              new Promise<ArrayBuffer>((resolve) => {
                resolveRead = resolve;
              })
          );
          const closeSpy = jest.spyOn(native, 'close');
          const pending = handle.readBytes(3, { at: 3 });
          handle.close();
          expect(handle.offset).toBeNull();
          await Promise.resolve();
          expect(closeSpy).not.toHaveBeenCalled();
          resolveRead(encode('def').buffer as ArrayBuffer);
          expect(await pending).toEqual(encode('def'));
          await Promise.resolve();
          await Promise.resolve();
          expect(closeSpy).toHaveBeenCalledTimes(1);
          expect(() => handle.readBytesSync(1, { at: 0 })).toThrow('The file handle is closed');
          await expect(handle.readBytes(1, { at: 0 })).rejects.toThrow('The file handle is closed');
          await expect(handle.writeBytes(encode('x'), { at: 0 })).rejects.toThrow(
            'The file handle is closed'
          );
        });

        it('lets a positional read finish while a cursor read is still pending', async () => {
          const file = makeFile('at-skips-queue.txt', 'abcdef');
          const handle = file.open(FileMode.ReadOnly);
          const native = (handle as any).native;
          let resolveRead!: (bytes: ArrayBuffer) => void;
          jest.spyOn(native, 'readAt').mockImplementationOnce(
            () =>
              new Promise<ArrayBuffer>((resolve) => {
                resolveRead = resolve;
              })
          );
          const stuck = handle.readBytes(2);
          // The queued read starts on the next microtask, so let it take the stub first.
          await Promise.resolve();
          expect(await handle.readBytes(2, { at: 4 })).toEqual(encode('ef'));
          resolveRead(encode('ab').buffer as ArrayBuffer);
          expect(await stuck).toEqual(encode('ab'));
          expect(handle.offset).toBe(2);
          handle.close();
        });

        it('rejects a position that is negative, fractional or not a number', async () => {
          const file = makeFile('bad-position.txt', 'abc');
          const handle = file.open(FileMode.ReadWrite);
          for (const at of [-1, 1.5, NaN, Infinity]) {
            expect(() => handle.readBytesSync(1, { at })).toThrow(RangeError);
            expect(() => handle.readIntoSync(new Uint8Array(1), { at })).toThrow(RangeError);
            expect(() => handle.writeBytesSync(encode('x'), { at })).toThrow(RangeError);
            await expect(handle.readBytes(1, { at })).rejects.toThrow(RangeError);
            await expect(handle.readInto(new Uint8Array(1), { at })).rejects.toThrow(RangeError);
            await expect(handle.writeBytes(encode('x'), { at })).rejects.toThrow(RangeError);
          }
          handle.offset = -1;
          expect(() => handle.readBytesSync(1)).toThrow(RangeError);
          await expect(handle.readBytes(1)).rejects.toThrow(RangeError);
          handle.offset = 0;
          expect(handle.readBytesSync(3)).toEqual(encode('abc'));
          handle.close();
        });

        it('writeBytes and writeBytesSync accept an ArrayBuffer and write only the range of a view', async () => {
          const file = makeFile('write-views.txt', '------');
          const handle = file.open(FileMode.ReadWrite);
          const backing = encode('xxabcdxx').buffer;
          // A view must write its own byte range, not the whole backing buffer.
          handle.writeBytesSync(new Uint8Array(backing, 2, 2), { at: 0 });
          await handle.writeBytes(new DataView(backing, 4, 2), { at: 2 });
          expect(file.textSync()).toBe('abcd--');
          handle.writeBytesSync(encode('ef').buffer as ArrayBuffer, { at: 4 });
          await handle.writeBytes(new Uint16Array(encode('gh').buffer), { at: 0 });
          expect(file.textSync()).toBe('ghcdef');
          handle.close();
        });

        it('readIntoSync fills the buffer, returns the count, and stops at EOF', () => {
          const file = makeFile('into-sync.txt', 'abcdef');
          const handle = file.open(FileMode.ReadOnly);
          const target = new Uint8Array(4).fill(0xff);
          expect(handle.readIntoSync(target, { at: 1 })).toBe(4);
          expect(target).toEqual(encode('bcde'));
          expect(handle.readIntoSync(target, { at: 4 })).toBe(2);
          expect(target).toEqual(new Uint8Array([...encode('ef'), ...encode('de')]));
          expect(handle.readIntoSync(target, { at: 6 })).toBe(0);
          expect(handle.readIntoSync(new Uint8Array(0), { at: 0 })).toBe(0);
          expect(handle.offset).toBe(0);
          handle.close();
        });

        it('readIntoSync writes only into the given view', () => {
          const file = makeFile('into-view.txt', 'abcdef');
          const handle = file.open(FileMode.ReadOnly);
          const backing = new ArrayBuffer(12);
          const view = new Uint8Array(backing, 4, 4);
          expect(handle.readIntoSync(view, { at: 0 })).toBe(4);
          expect(new Uint8Array(backing)).toEqual(
            new Uint8Array([0, 0, 0, 0, ...encode('abcd'), 0, 0, 0, 0])
          );
          const dataView = new DataView(backing, 8, 2);
          expect(handle.readIntoSync(dataView, { at: 4 })).toBe(2);
          expect(new Uint8Array(backing, 8, 4)).toEqual(new Uint8Array([...encode('ef'), 0, 0]));
          expect(handle.readIntoSync(backing, { at: 0 })).toBe(6);
          expect(new Uint8Array(backing, 0, 6)).toEqual(encode('abcdef'));
          handle.close();
        });

        it('readInto without at reads at the offset and advances it in call order', async () => {
          const file = makeFile('into-cursor.txt', 'abcdef');
          const handle = file.open(FileMode.ReadOnly);
          const target = new Uint8Array(2);
          const first = handle.readInto(target);
          const second = handle.readBytes(2);
          expect(await first).toBe(2);
          expect(target).toEqual(encode('ab'));
          expect(await second).toEqual(encode('cd'));
          expect(handle.readIntoSync(target)).toBe(2);
          expect(target).toEqual(encode('ef'));
          expect(handle.offset).toBe(6);
          handle.close();
        });

        it('readInto with at runs concurrently and copies into each buffer', async () => {
          const file = makeFile('into-concurrent.txt', 'abcdef');
          const handle = file.open(FileMode.ReadOnly);
          const a = new Uint8Array(3);
          const b = new Uint8Array(3);
          const [countB, countA] = await Promise.all([
            handle.readInto(b, { at: 3 }),
            handle.readInto(a, { at: 0 }),
          ]);
          expect([countA, countB]).toEqual([3, 3]);
          expect(a).toEqual(encode('abc'));
          expect(b).toEqual(encode('def'));
          expect(handle.offset).toBe(0);
          handle.close();
        });

        it('readInto rejects on a write-only or closed handle', async () => {
          const file = makeFile('into-errors.txt', 'abc');
          const writeOnly = file.open(FileMode.WriteOnly);
          expect(() => writeOnly.readIntoSync(new Uint8Array(1), { at: 0 })).toThrow();
          await expect(writeOnly.readInto(new Uint8Array(1), { at: 0 })).rejects.toThrow();
          writeOnly.close();
          const closed = file.open(FileMode.ReadOnly);
          closed.close();
          expect(() => closed.readIntoSync(new Uint8Array(1))).toThrow('The file handle is closed');
          await expect(closed.readInto(new Uint8Array(1), { at: 0 })).rejects.toThrow(
            'The file handle is closed'
          );
        });
      });
    });
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
