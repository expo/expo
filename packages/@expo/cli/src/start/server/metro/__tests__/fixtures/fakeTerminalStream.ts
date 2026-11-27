import { Writable } from 'node:stream';
import tty from 'node:tty';
import { stripVTControlCharacters } from 'node:util';

const ESC = String.fromCharCode(0x1b);
const TOKEN = new RegExp(`${ESC}\\[(\\d*)([A-Za-z])|\\n|[^${ESC}\\n]+`, 'g');

/** A TTY stream that applies the cursor movement Metro's `Terminal` writes to a screen of lines. */
export function createFakeTTYStream({ columns = 80, rows = 24 } = {}) {
  const screen = [''];
  let row = 0;
  let column = 0;

  function write(chunk: string | Uint8Array, ...rest: unknown[]): boolean {
    for (const [token, count, command] of String(chunk).matchAll(TOKEN)) {
      if (token === '\n') {
        row++;
        column = 0;
        screen[row] ??= '';
      } else if (command === 'A') {
        row = Math.max(0, row - Number(count || 1));
      } else if (command === 'D') {
        column = Math.max(0, column - Number(count || 1));
      } else if (command === 'J') {
        screen.length = row + 1;
        screen[row] = screen[row]!.slice(0, column);
      } else if (command == null) {
        const line = screen[row]!.padEnd(column);
        screen[row] = line.slice(0, column) + token + line.slice(column + token.length);
        column += token.length;
      }
    }
    const callback = rest.find((arg) => typeof arg === 'function') as (() => void) | undefined;
    callback?.();
    return true;
  }

  const stream = Object.assign(Object.create(tty.WriteStream.prototype), {
    isTTY: true,
    columns,
    rows,
    write,
  }) as tty.WriteStream;

  return {
    stream,
    lines: () => stripVTControlCharacters(screen.join('\n')).replace(/\n$/, '').split('\n'),
  };
}

/** A non-TTY stream, such as a pipe, that collects what is written to it. */
export function createFakePipeStream() {
  let output = '';
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      output += String(chunk);
      callback();
    },
  });
  return {
    stream,
    lines: () => stripVTControlCharacters(output).replace(/\n$/, '').split('\n'),
  };
}
