import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { LogStream } from '../stream';

jest.unmock('fs');

let destFile: string;
let destFD: number;

beforeEach(() => {
  destFile = path.resolve(tmpdir(), `logstream-${Math.random().toString(36).substring(7)}.log`);
  destFD = fs.openSync(destFile, 'w', 0o666);
});

afterEach(async () => {
  try {
    fs.closeSync(destFD);
  } catch {}
  try {
    fs.unlinkSync(destFile);
  } catch {}
});

describe('basic write operations', () => {
  it('writes before destroying a stream', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    expect(stream.write('hello world\n')).toBeTruthy();
    stream.destroy();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('hello world\n');
  });

  it('writes twice then ends a stream', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    expect(stream.write('line 1\n')).toBeTruthy();
    expect(stream.write('line 2\n')).toBeTruthy();
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('line 1\nline 2\n');
  });

  it('performs partial writes atomically', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    expect(stream.write('line')).toBeTruthy();
    expect(stream.write(' 1\n')).toBeTruthy();
    stream.destroy();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('line 1\n');
  });

  it('writes multiple lines in a single call', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('line 1\nline 2\nline 3\n');
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('line 1\nline 2\nline 3\n');
  });

  it('handles empty writes', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('');
    stream.write('hello\n');
    stream.write('');
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('hello\n');
  });

  it('writes with Uint8Array input', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    const data = new TextEncoder().encode('hello world\n');
    stream.write(data);
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('hello world\n');
  });
});

describe('partial line handling', () => {
  it('accumulates multiple partial writes before newline', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('a');
    stream.write('b');
    stream.write('c');
    stream.write('\n');
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('abc\n');
  });

  it('handles interleaved complete and partial lines', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('complete 1\npartial');
    stream.write(' complete 2\n');
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('complete 1\npartial complete 2\n');
  });

  it('does not write incomplete lines on destroy', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('complete\n');
    stream.write('incomplete');
    stream.destroy();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('complete\n');
  });

  it('does not write incomplete lines on end', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('complete\n');
    stream.write('incomplete');
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('complete\n');
  });
});

describe('flush behavior', () => {
  it('flushes complete lines and calls callback', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('line 1\n');

    await new Promise<void>((resolve, reject) => {
      stream.flush((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('line 1\n');

    stream.end();
    await _close;
  });

  it('preserves partial line data after flush', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('partial');

    await new Promise<void>((resolve, reject) => {
      stream.flush((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    stream.write(' complete\n');
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('partial complete\n');
  });

  it('preserves partial line when flushing with complete lines', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('complete 1\n');
    stream.write('partial');

    await new Promise<void>((resolve, reject) => {
      stream.flush((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('complete 1\n');

    stream.write(' complete 2\n');
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('complete 1\npartial complete 2\n');
  });

  it('handles multiple flushes', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('line 1\n');
    await new Promise<void>((resolve) => stream.flush(() => resolve()));

    stream.write('line 2\n');
    await new Promise<void>((resolve) => stream.flush(() => resolve()));

    stream.end();
    await _close;

    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('line 1\nline 2\n');
  });

  it('flush on empty stream completes immediately', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    await new Promise<void>((resolve, reject) => {
      stream.flush((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    stream.end();
    await _close;
  });

  it('flush on destroyed stream calls callback immediately', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.destroy();
    await _close;

    let callbackCalled = false;
    stream.flush(() => {
      callbackCalled = true;
    });

    expect(callbackCalled).toBe(true);
  });
});

describe('end behavior', () => {
  it('end with data writes the data', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.end('final line\n');

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('final line\n');
  });

  it('end with callback calls callback on close', async () => {
    const stream = new LogStream(destFD);

    await new Promise<void>((resolve) => {
      stream.write('line\n');
      stream.end(() => resolve());
    });

    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('line\n');
  });

  it('end with data and callback', async () => {
    const stream = new LogStream(destFD);

    await new Promise<void>((resolve) => {
      stream.end('line\n', resolve);
    });

    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('line\n');
  });

  it('emits finish event on end', async () => {
    const stream = new LogStream(destFD);
    const _finish = new Promise((resolve) => stream.on('finish', resolve));
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('line\n');
    stream.end();

    await _finish;
    await _close;
  });

  it('multiple end calls are idempotent', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('line\n');
    stream.end();
    stream.end();
    stream.end();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('line\n');
  });
});

describe('file path support', () => {
  it('opens and writes to file path', async () => {
    const filePath = path.resolve(tmpdir(), `logstream-path-${Date.now()}.log`);
    const stream = new LogStream(filePath);

    const _ready = new Promise((resolve) => stream.on('ready', resolve));
    await _ready;

    expect(stream.file).toBe(filePath);
    expect(stream.fd).toBeGreaterThan(0);

    const _close = new Promise((resolve) => stream.on('close', resolve));
    stream.write('hello from path\n');
    stream.end();

    await _close;
    expect(await fs.promises.readFile(filePath, 'utf8')).toBe('hello from path\n');

    await fs.promises.unlink(filePath);
  });

  it('creates parent directories for file path', async () => {
    const filePath = path.resolve(tmpdir(), `logstream-nested-${Date.now()}`, 'subdir', 'test.log');
    const stream = new LogStream(filePath);

    const _ready = new Promise((resolve) => stream.on('ready', resolve));
    await _ready;

    const _close = new Promise((resolve) => stream.on('close', resolve));
    stream.write('nested file\n');
    stream.end();

    await _close;
    expect(await fs.promises.readFile(filePath, 'utf8')).toBe('nested file\n');

    await fs.promises.rm(path.dirname(path.dirname(filePath)), { recursive: true });
  });

  it('queues writes before file is opened', async () => {
    const filePath = path.resolve(tmpdir(), `logstream-queue-${Date.now()}.log`);
    const stream = new LogStream(filePath);

    stream.write('line 1\n');
    stream.write('line 2\n');

    const _close = new Promise((resolve) => stream.on('close', resolve));
    stream.end();

    await _close;
    expect(await fs.promises.readFile(filePath, 'utf8')).toBe('line 1\nline 2\n');

    await fs.promises.unlink(filePath);
  });
});

describe('stream properties', () => {
  it('writable is true initially', () => {
    const stream = new LogStream(destFD);
    expect(stream.writable).toBe(true);
  });

  it('writable is false after end', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.end();
    expect(stream.writable).toBe(false);

    await _close;
  });

  it('writable is false after destroy', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.destroy();
    expect(stream.writable).toBe(false);

    await _close;
  });

  it('fd returns the file descriptor', () => {
    const stream = new LogStream(destFD);
    expect(stream.fd).toBe(destFD);
  });

  it('file returns null for fd-based stream', () => {
    const stream = new LogStream(destFD);
    expect(stream.file).toBeNull();
  });
});

describe('events', () => {
  it('emits ready event on next tick for fd', async () => {
    const stream = new LogStream(destFD);
    const _ready = new Promise((resolve) => stream.on('ready', resolve));
    await _ready;
  });

  it('emits drain event when buffer is flushed', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('line\n');

    const _drain = new Promise((resolve) => stream.on('drain', resolve));
    await _drain;

    stream.end();
    await _close;
  });

  it('emits write event with bytes written', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    const writes: number[] = [];
    stream.on('write', (written) => writes.push(written));

    stream.write('hello\n');
    stream.end();

    await _close;
    expect(writes.length).toBeGreaterThan(0);
    expect(writes.reduce((a, b) => a + b, 0)).toBe(6);
  });

  it('emits close event on destroy', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.destroy();
    await _close;
  });
});

describe('write returns backpressure signal', () => {
  it('returns true when under high water mark', () => {
    const stream = new LogStream(destFD);
    const result = stream.write('small\n');
    expect(result).toBe(true);
    stream.destroy();
  });

  it('returns false when over high water mark', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    const largeLine = 'x'.repeat(20000) + '\n';
    const result = stream.write(largeLine);
    expect(result).toBe(false);

    stream.end();
    await _close;
  });
});

describe('destroyed stream behavior', () => {
  it('write returns false on destroyed stream', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.destroy();
    await _close;

    expect(stream.write('ignored\n')).toBe(false);
  });
});

describe('Symbol.dispose', () => {
  it('disposes the stream', async () => {
    const stream = new LogStream(destFD);
    const _close = new Promise((resolve) => stream.on('close', resolve));

    stream.write('line\n');
    stream[Symbol.dispose]();

    await _close;
    expect(await fs.promises.readFile(destFile, 'utf8')).toBe('line\n');
  });
});
