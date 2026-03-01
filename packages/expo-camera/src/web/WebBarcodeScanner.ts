import type { BarcodeType, BarcodeScanningResult } from '../Camera.types';

/**
 * Mapping from expo BarcodeType to BarcodeDetector format string.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API#supported_barcode_formats
 */
const EXPO_TO_WEB_FORMAT: Record<BarcodeType, string> = {
  aztec: 'aztec',
  codabar: 'codabar',
  code39: 'code_39',
  code93: 'code_93',
  code128: 'code_128',
  datamatrix: 'data_matrix',
  ean8: 'ean_8',
  ean13: 'ean_13',
  itf14: 'itf',
  pdf417: 'pdf417',
  qr: 'qr_code',
  upc_a: 'upc_a',
  upc_e: 'upc_e',
};

const WEB_TO_EXPO_FORMAT: Record<string, BarcodeType> = Object.fromEntries(
  Object.entries(EXPO_TO_WEB_FORMAT).map(([expo, web]) => [web, expo as BarcodeType])
);

export const ALL_BARCODE_TYPES = Object.keys(EXPO_TO_WEB_FORMAT) as BarcodeType[];

type BarcodeDetectorLike = {
  detect(source: ImageBitmapSource): Promise<DetectedBarcodeLike[]>;
};

type DetectedBarcodeLike = {
  format: string;
  rawValue: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
};

let cachedDetector: BarcodeDetectorLike | null = null;
let cachedFormats: string[] | null = null;

function formatsChanged(barcodeTypes: BarcodeType[]): boolean {
  const webFormats = barcodeTypes.map((t) => EXPO_TO_WEB_FORMAT[t]).sort();
  if (!cachedFormats) {
    return true;
  }
  if (cachedFormats.length !== webFormats.length) {
    return true;
  }
  return webFormats.some((f, i) => f !== cachedFormats![i]);
}

async function getDetector(barcodeTypes: BarcodeType[]): Promise<BarcodeDetectorLike> {
  if (cachedDetector && !formatsChanged(barcodeTypes)) {
    return cachedDetector;
  }

  const webFormats = barcodeTypes.map((t) => EXPO_TO_WEB_FORMAT[t]);
  cachedFormats = [...webFormats].sort();

  const NativeBarcodeDetector = (globalThis as any).BarcodeDetector;
  if (typeof NativeBarcodeDetector !== 'undefined') {
    const detector: BarcodeDetectorLike = new NativeBarcodeDetector({ formats: webFormats });
    cachedDetector = detector;
    return detector;
  }

  const { BarcodeDetector } = await import('barcode-detector');
  const detector: BarcodeDetectorLike = new BarcodeDetector({ formats: webFormats as any });
  cachedDetector = detector;
  return detector;
}

export async function detect(
  source: ImageBitmapSource,
  barcodeTypes: BarcodeType[]
): Promise<BarcodeScanningResult[]> {
  const detector = await getDetector(barcodeTypes);
  const barcodes = await detector.detect(source);

  return barcodes.map((barcode) => {
    const { x, y, width, height } = barcode.boundingBox;
    return {
      type: WEB_TO_EXPO_FORMAT[barcode.format] ?? barcode.format,
      data: barcode.rawValue,
      bounds: {
        origin: { x, y },
        size: { width, height },
      },
      cornerPoints: barcode.cornerPoints?.map((p) => ({ x: p.x, y: p.y })) ?? [],
    };
  });
}
