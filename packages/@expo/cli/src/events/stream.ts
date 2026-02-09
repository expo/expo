import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';

const BUSY_WRITE_TIMEOUT = 100;
const HIGH_WATER_MARK = 16_387; /*16KB*/

export class LogStream extends EventEmitter implements NodeJS.WritableStream {
  #fd = -1;
  #file: string | null = null;

  #writing = false;
  #ending = false;
  #flushPending = false;
  #destroyed = false;
  #opening = false;

  #output = '';
  #len = 0;
  #lines: string[] = [];
  #partialLine = 0;

  constructor(dest: string | number) {
    super();
    if (typeof dest === 'number') {
      fs.fsyncSync(dest);
      this.#fd = dest;
      process.nextTick(() => this.emit('ready'));
    } else if (typeof dest === 'string') {
      this.#openFile(dest);
    }
  }

  get file(): string | null {
    return this.#file;
  }

  get fd(): number {
    return this.#fd;
  }

  get writing(): boolean {
    return this.#writing;
  }

  get writable(): boolean {
    return !this.#destroyed && !this.#ending;
  }

  #release(error: NodeJS.ErrnoException | null, written: number) {
    if (error) {
      if (error.code === 'EAGAIN' || error.code === 'EBUSY') {
        setTimeout(() => this.#writeLine(), BUSY_WRITE_TIMEOUT);
      } else {
        this.#writing = false;
        this.emit('error', error);
      }
    } else {
      this.emit('write', written);

      const outputLength = Buffer.byteLength(this.#output);
      if (outputLength > written) {
        const output = Buffer.from(this.#output).subarray(written).toString();
        this.#len -= this.#output.length - output.length;
        this.#output = output;
      } else {
        this.#len -= this.#output.length;
        this.#output = '';
      }

      if (this.#output || this.#lines.length > this.#partialLine) {
        this.#writeLine();
      } else if (this.#ending) {
        this.#writing = false;
        this.#close();
      } else {
        this.#writing = false;
        this.emit('drain');
      }
    }
  }

  #openFile(file: string) {
    this.#opening = true;
    this.#writing = true;

    const onOpened = (error: Error | null, fd?: number | null) => {
      if (error) {
        this.#writing = false;
        this.#opening = false;
        this.emit('error', error);
      } else {
        this.#fd = fd!;
        this.#file = file;
        this.#opening = false;
        this.#writing = false;
        this.emit('ready');
        if (this.#destroyed) {
          // do nothing when we're already closing the file
        } else if (
          (!this.writing && this.#lines.length > this.#partialLine) ||
          this.#flushPending
        ) {
          this.#writeLine();
        }
      }
    };

    fs.mkdir(path.dirname(file), { recursive: true }, (err) => {
      if (err) return onOpened(err);
      fs.open(file, 'a', 0o666, onOpened);
    });
  }

  #close() {
    if (this.#fd === -1) {
      this.once('ready', () => this.#close());
      return;
    }

    this.#destroyed = true;
    this.#partialLine = 0;
    this.#lines.length = 0;

    const onClose = (error?: NodeJS.ErrnoException | null) => {
      if (error) {
        this.emit('error', error);
        this.emit('close', error);
      } else {
        if (this.#ending && !this.#writing) this.emit('finish');
        this.emit('close');
      }
    };

    fsFsync(this.#fd, (error) => {
      if (!error && !isStdFd(this.#fd)) {
        fs.close(this.#fd, onClose);
      } else {
        onClose(); // Error intentionally ignored, assume closed
      }
    });
  }

  #writeLine() {
    this.#writing = true;
    this.#output ||= this.#lines.length > this.#partialLine ? this.#lines.shift() || '' : '';
    fs.write(this.#fd, this.#output, (err, written) => this.#release(err, written));
  }

  _end() {
    if (!this.#destroyed && !this.#ending) {
      this.#ending = true;
      if (this.#opening) {
        this.once('ready', () => this._end());
      } else if (!this.#writing && this.#fd >= 0) {
        if (this.#lines.length > this.#partialLine) {
          this.#writeLine();
        } else {
          this.#close();
        }
      }
    }
    return this;
  }

  end(cb?: () => void): this;
  end(data: string | Uint8Array, cb?: () => void): this;
  end(str: string, encoding?: BufferEncoding, cb?: () => void): this;

  end(
    arg1?: Uint8Array | string | (() => void),
    arg2?: BufferEncoding | (() => void),
    arg3?: () => void
  ) {
    const maybeCb = arg3 || arg2 || arg1;
    const input = typeof arg1 !== 'function' ? arg1 : undefined;
    const encoding = typeof arg2 === 'string' ? arg2 : 'utf8';
    const cb = typeof maybeCb === 'function' ? maybeCb : undefined;
    if (typeof input === 'string') {
      this.write(input, encoding);
    } else if (input != null) {
      this.write(input);
    }
    if (cb) this.once('close', cb);
    return this._end();
  }

  destroy() {
    if (!this.#destroyed) this.#close();
  }

  flush(cb?: (error?: Error | null) => void) {
    if (this.#destroyed) {
      cb?.();
    } else {
      const onDrain = () => {
        if (!this.#destroyed) {
          fsFsync(this.#fd, (error) => {
            this.#flushPending = false;
            if (error?.code === 'EBADF') {
              cb?.(); // If fd is closed, ignore the error
            } else {
              cb?.(error);
            }
          });
        } else {
          this.#flushPending = false;
          cb?.();
        }
        this.off('error', onError);
      };

      const onError = (err: Error) => {
        this.#flushPending = false;
        this.off('drain', onDrain);
        cb?.(err);
      };

      this.#flushPending = true;
      this.once('drain', onDrain);
      this.once('error', onError);

      if (!this.#writing) {
        if (this.#lines.length > this.#partialLine || this.#output) {
          // There are complete lines or remaining output to write
          this.#writeLine();
        } else {
          // Nothing complete to write, emit drain immediately
          process.nextTick(() => this.emit('drain'));
        }
      }
    }
  }

  _write(data: string): boolean {
    if (this.#destroyed) {
      return false;
    }

    this.#len += data.length;

    let startIdx = 0;
    let endIdx = -1;
    while ((endIdx = data.indexOf('\n', startIdx)) > -1) {
      const line = data.slice(startIdx, endIdx + 1);
      if (this.#partialLine > 0) {
        this.#lines[this.#lines.length - 1] += line;
      } else {
        this.#lines.push(line);
      }
      this.#partialLine = 0;
      startIdx = ++endIdx;
    }

    if (startIdx < data.length) {
      const line = data.slice(startIdx);
      if (this.#partialLine > 0) {
        this.#lines[this.#lines.length - 1] += line;
      } else {
        this.#lines.push(data.slice(startIdx));
      }
      this.#partialLine = 1;
    }

    if (!this.#writing && this.#lines.length > this.#partialLine) {
      this.#writeLine();
    }

    return this.#len < HIGH_WATER_MARK;
  }

  write(buffer: Uint8Array | string, cb?: (err?: Error | null) => void): boolean;
  write(str: string, encoding?: BufferEncoding, cb?: (err?: Error | null) => void): boolean;

  write(
    input: Uint8Array | string,
    arg2?: BufferEncoding | ((err?: Error | null) => void),
    arg3?: (err?: Error | null) => void
  ): boolean {
    const maybeCb = arg3 || arg2;
    const encoding = typeof arg2 === 'string' ? arg2 : 'utf8';
    const data = typeof input === 'string' ? input : Buffer.from(input).toString(encoding);
    const cb = typeof maybeCb === 'function' ? maybeCb : undefined;
    try {
      return this._write(data);
    } finally {
      cb?.();
    }
  }

  [Symbol.dispose]() {
    this.destroy();
  }
}

const isStdFd = (fd: number) => {
  switch (fd) {
    case 1:
    case 2:
    case process.stdout.fd:
    case process.stderr.fd:
      return true;
    default:
      return false;
  }
};

const fsFsync = (fd: number, cb: (error?: NodeJS.ErrnoException | null) => void) => {
  try {
    fs.fsync(fd, cb);
  } catch (error: any) {
    cb(error);
  }
};
