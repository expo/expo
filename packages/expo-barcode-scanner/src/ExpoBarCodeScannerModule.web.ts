export default {
  get name(): string {
    return 'ExpoBarCodeScannerModule';
  },
  get BarCodeType(): string[] {
    return [];
  },
  get Type(): { front: 'front'; back: 'back' } {
    return { front: 'front', back: 'back' };
  },
};
