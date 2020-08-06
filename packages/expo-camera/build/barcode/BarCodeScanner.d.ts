import { BarCodeSettings } from '../Camera.types';
export default class BarCodeScanner {
    private videoElement;
    canvas?: HTMLCanvasElement;
    drawBarcodeOptions: any;
    private webWorker?;
    private barcodeLoop?;
    isImageMirrored: boolean;
    constructor(videoElement: HTMLVideoElement);
    private scanForBarcodes;
    private invokeWorker;
    startScanner(settings: BarCodeSettings, callback: (results: any) => void): void;
    stopScanner(): void;
}
