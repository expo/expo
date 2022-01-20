import qrcode from 'qrcode-terminal';

import * as Log from '../../log';

export function printQRCode(url: string) {
  qrcode.generate(url, { small: true }, (code) => Log.log(code));
}
