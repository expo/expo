import { CaptureOptions } from 'react-native-view-shot';
declare type FillStyle = string | CanvasGradient | CanvasPattern;
interface SVGOptions {
    bgcolor?: FillStyle;
    width?: number;
    height?: number;
    style?: any;
    quality?: number;
    missingImageSource?: string;
    preventCaching?: boolean;
}
export declare function createSVGAsync(element: Element, options?: SVGOptions): Promise<string>;
export declare function createPixelDataAsync(element: Element, options: CaptureOptions): Promise<Uint8ClampedArray>;
export declare function createPNGAsync(element: Element, options: CaptureOptions): Promise<string>;
export declare function createJPEGAsync(element: Element, { quality, ...options }: CaptureOptions): Promise<string>;
export declare function createBlobAsync(element: Element, { quality, ...options }: CaptureOptions): Promise<Blob>;
export {};
