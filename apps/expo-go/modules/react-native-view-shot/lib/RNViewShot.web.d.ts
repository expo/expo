import type { CaptureOptions } from "./index";
declare function captureRef(view: HTMLElement, options: CaptureOptions): Promise<string>;
declare function captureScreen(options: CaptureOptions): Promise<string>;
declare function releaseCapture(_uri: string): void;
declare const _default: {
    captureRef: typeof captureRef;
    captureScreen: typeof captureScreen;
    releaseCapture: typeof releaseCapture;
};
export default _default;
//# sourceMappingURL=RNViewShot.web.d.ts.map