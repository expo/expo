import { CaptureOptions } from 'react-native-view-shot';
/**
 * Taking a snapshot of DOM is not part of native browser behavior.
 * This is a hack to best emulate mobile functionality.
 * This implementation is based on https://github.com/pbakaus/domvas by Paul Bakaus http://paulbakaus.com/
 */
export default function captureRef(component: Element, options?: CaptureOptions): Promise<string | Uint8ClampedArray | Blob>;
