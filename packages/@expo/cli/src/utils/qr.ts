import { toQR } from 'toqr';

import * as Log from '../log';

/** Print the world famous 'Expo QR Code'. */
export function printQRCode(url: string) {
  const qr = toQR(url);
  const output = createHalfblockOutput(qr);
  Log.log(output + '\n');
}

/** ANSI QR code output by using half-blocks (2x1-sized unicode blocks) */
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
  return output;
}
