import tty from 'node:tty';
import { toQR } from 'toqr';

import { env } from './env';
import * as Log from '../log';

export interface QROutput {
  lines: number;
  print(): void;
}

/** Stringifies URLSearchParameters but leaves them un-URI-encoded, if possible */
function buildSearchString(params: URLSearchParams) {
  let search = '';
  for (let [key, value] of params) {
    if (/[=&]/.test(value)) {
      // If the value contains special query characters, we back off and percentage encode the value
      value = encodeURIComponent(value);
    } else if (key === 'url') {
      try {
        const url = new URL(value);
        // We can strip off a single slash to form an empty pathname
        url.pathname = url.pathname !== '/' ? url.pathname : '';
        // If we have a URL as a search parameter, we can discard the hash
        url.hash = '';
        value = url.href.replace(/ /g, '+');
      } catch {}
    }
    if (search) search += '&';
    search += `${key}=${value}`;
  }
  return search;
}

/** Shrink the URL by re-stringifying the search params manually */
function shrinkURL(input: string) {
  try {
    const url = new URL(input);
    const search = buildSearchString(url.searchParams);
    // We can strip off a single slash to form an empty pathname
    url.pathname = url.pathname !== '/' ? url.pathname : '';
    if (search) {
      url.search = '';
      url.hash = '';
      return `${url.href}?${search}`;
    } else {
      return url.href;
    }
  } catch {
    return input;
  }
}

/** Print the world famous 'Expo QR Code'. */
export function printQRCode(url: string): QROutput {
  const qr = toQR(shrinkURL(url));
  const output = supportsSextants() ? createSextantOutput(qr) : createHalfblockOutput(qr);
  return {
    lines: output.split('\n').length,
    print() {
      Log.log(output);
    },
  };
}

/** On specific terminals we can print a smaller QR code */
function supportsSextants() {
  if (env.CI || !tty.isatty(1) || !tty.isatty(2)) {
    return false;
  } else if (process.env.COLOR === '0' || process.env.COLOR === 'false') {
    return false;
  }
  const isWindowsTerminal = process.platform === 'win32' && !!process.env.WT_SESSION?.length;
  const isGhostty = process.env.TERM_PROGRAM === 'ghostty';
  const isWezterm = process.env.TERM_PROGRAM === 'WezTerm';
  const isKitty = !!process.env.KITTY_WINDOW_ID?.length;
  const isAlacritty = !!process.env.ALACRITTY_WINDOW_ID?.length;
  return isWindowsTerminal || isGhostty || isWezterm || isKitty || isAlacritty;
}

/** ANSI QR code output by using half-blocks (1x2-sized unicode blocks) */
function createHalfblockOutput(data: Uint8Array): string {
  const extent = Math.sqrt(data.byteLength) | 0;
  const CHAR_00 = '\u2588';
  const CHAR_10 = '\u2584';
  const CHAR_01 = '\u2580';
  const CHAR_11 = ' ';
  let output = '';
  output += CHAR_10.repeat(extent + 2);
  for (let row = 0; row < extent; row += 2) {
    output += '\n' + CHAR_00;
    for (let col = 0; col < extent; col++) {
      const value = (data[row * extent + col] << 1) | data[(row + 1) * extent + col];
      switch (value) {
        case 0b00:
          output += CHAR_00;
          break;
        case 0b01:
          output += CHAR_01;
          break;
        case 0b10:
          output += CHAR_10;
          break;
        case 0b11:
          output += CHAR_11;
          break;
      }
    }
    output += CHAR_00;
  }
  if (extent % 2 === 0) {
    output += '\n' + CHAR_01.repeat(extent + 2);
  }
  output += '\n';
  return output;
}

/** ANSI QR code output by using sextant-blocks (2x3-sized unicode blocks) */
function createSextantOutput(data: Uint8Array): string {
  const getChar = (p: number): string => {
    // Invert then reverse
    let char = p ^ 0b111111;
    char = ((char & 0xaa) >> 1) | ((char & 0x55) << 1);
    char = ((char & 0xcc) >> 2) | ((char & 0x33) << 2);
    char = (char >> 4) | (char << 4);
    char = (char >> 2) & 63;
    switch (char) {
      case 0:
        return ' ';
      case 63:
        return '\u2588';
      case 21:
        return '\u258C';
      case 42:
        return '\u2590';
      default:
        return String.fromCodePoint(0x1fb00 + char - 1 - (char > 21 ? 1 : 0) - (char > 42 ? 1 : 0));
    }
  };
  const extent = Math.sqrt(data.byteLength) | 0;
  const padded = extent + 2;
  let output = '';
  for (let baseRow = 0; baseRow < padded; baseRow += 3) {
    if (baseRow) output += '\n';
    for (let baseCol = 0; baseCol < padded; baseCol += 2) {
      let p = 0;
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 2; dc++) {
          const r = baseRow + dr;
          const c = baseCol + dc;
          const bit = 5 - (dr * 2 + dc);
          let cell = 1; // default empty (out of bounds)
          if (r < padded && c < padded) {
            if (r === 0 || c === 0 || r === padded - 1 || c === padded - 1) {
              cell = 0; // border is filled
            } else if (r <= extent && c <= extent) {
              cell = data[(r - 1) * extent + (c - 1)];
            }
          }
          p |= (cell & 1) << bit;
        }
      }
      output += getChar(p);
    }
  }
  if (padded % 3 === 0) {
    // Only add newline if the padded output lines up with a newline exactly
    output += '\n';
  }
  return output;
}
