export default {
  get name(): string {
    return 'ExpoBarCodeScannerModule';
  },
  get BarCodeType() {
    return {
      code39mod43: 'code39mod43',
      code138: 'code138',
      interleaved2of5: 'interleaved2of5',
      aztec: 'aztec',
      ean13: 'ean13',
      ean8: 'ean8',
      qr: 'qr',
      pdf417: 'pdf417',
      upc_e: 'upc_e',
      datamatrix: 'datamatrix',
      code39: 'code39',
      code93: 'code93',
      itf14: 'itf14',
      codabar: 'codabar',
      code128: 'code128',
      upc_a: 'upc_a',
    };
  },
  get Type() {
    return { front: 'front', back: 'back' };
  },
};
