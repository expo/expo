import type { BarcodeType, BarcodeScanningResult } from '../Camera.types';
export declare const ALL_BARCODE_TYPES: BarcodeType[];
export declare function detect(source: ImageBitmapSource, barcodeTypes: BarcodeType[]): Promise<BarcodeScanningResult[]>;
//# sourceMappingURL=WebBarcodeScanner.d.ts.map