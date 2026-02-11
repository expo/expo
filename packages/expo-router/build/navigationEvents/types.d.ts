export interface BasePageEvent {
    pathname: string;
    params: Record<string, string>;
    screenId: string;
}
/**
 * The rendering of the page started
 *
 * This can happen if screen is to be focused for the first time or when the screen is preloaded
 */
export interface PageWillRender extends BasePageEvent {
    type: 'pageWillRender';
}
export interface PageFocusedEvent extends BasePageEvent {
    type: 'pageFocused';
}
export interface PageBlurredEvent extends BasePageEvent {
    type: 'pageBlurred';
}
export interface PageRemoved extends BasePageEvent {
    type: 'pageRemoved';
}
//# sourceMappingURL=types.d.ts.map