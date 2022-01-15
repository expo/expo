/**
 * Switches a video element into fullscreen.
 */
export declare function requestFullscreen(element: HTMLMediaElement): Promise<void>;
/**
 * Switches a video element out of fullscreen.
 */
export declare function exitFullscreen(element: HTMLMediaElement): Promise<void>;
/**
 * Listens for fullscreen change events on a video element. The provided
 * callback will be called with `true` when the video is switched into
 * fullscreen and `false` when the video is switched out of fullscreen.
 */
export declare function addFullscreenListener(element: HTMLVideoElement, callback: (isFullscreen: boolean) => void): () => any;
//# sourceMappingURL=FullscreenUtils.web.d.ts.map