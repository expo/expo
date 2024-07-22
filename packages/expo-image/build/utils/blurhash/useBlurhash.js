// adapted from https://gist.github.com/ngbrown/d62eb518753378eb0a9bf02bb4723235
// modified from https://gist.github.com/WorldMaker/a3cbe0059acd827edee568198376b95a
// https://github.com/woltapp/react-blurhash/issues/3
import { useEffect, useState, useMemo } from 'react';
import decode from './decode';
import { isBlurhashString } from '../resolveSources';
const DEFAULT_SIZE = {
    width: 32,
    height: 32,
};
// We scale up the canvas to avoid an irritating visual glitch when animating in Chrome.
const scaleRatio = 10;
export function useBlurhash(blurhash, punch = 1) {
    punch = punch || 1;
    const [uri, setUri] = useState(null);
    const isBlurhash = (blurhash?.uri && isBlurhashString(blurhash.uri)) ?? false;
    useEffect(() => {
        let isCanceled = false;
        if (!blurhash || !blurhash.uri || !isBlurhash) {
            return;
        }
        const strippedBlurhashString = blurhash.uri.replace(/blurhash:\//, '');
        const pixels = decode(strippedBlurhashString, blurhash.width ?? DEFAULT_SIZE.width, blurhash.height ?? DEFAULT_SIZE.height, punch);
        const canvas = document.createElement('canvas');
        const upscaledCanvas = document.createElement('canvas');
        canvas.width = blurhash.width ?? DEFAULT_SIZE.width;
        canvas.height = blurhash.height ?? DEFAULT_SIZE.height;
        upscaledCanvas.width = (blurhash.width ?? DEFAULT_SIZE.width) * scaleRatio;
        upscaledCanvas.height = (blurhash.height ?? DEFAULT_SIZE.height) * scaleRatio;
        const context = canvas.getContext('2d');
        if (!context) {
            console.warn('Failed to decode blurhash');
            return;
        }
        const imageData = context.createImageData(canvas.width, canvas.height);
        imageData.data.set(pixels);
        context.putImageData(imageData, 0, 0);
        const upscaledContext = upscaledCanvas.getContext('2d');
        if (!upscaledContext) {
            console.warn('Failed to decode blurhash');
            return;
        }
        upscaledContext.scale(scaleRatio, scaleRatio);
        upscaledContext.drawImage(canvas, 0, 0);
        upscaledCanvas.toBlob((blob) => {
            if (!isCanceled) {
                setUri((oldUrl) => {
                    if (oldUrl) {
                        URL.revokeObjectURL(oldUrl);
                    }
                    return blob ? URL.createObjectURL(blob) : oldUrl;
                });
            }
        });
        return function cleanupBlurhash() {
            isCanceled = true;
            setUri((oldUrl) => {
                if (oldUrl) {
                    URL.revokeObjectURL(oldUrl);
                }
                return null;
            });
        };
    }, [blurhash?.uri, blurhash?.height, blurhash?.width, punch, isBlurhash]);
    const source = useMemo(() => (uri ? { uri } : null), [uri]);
    return [source, isBlurhash];
}
//# sourceMappingURL=useBlurhash.js.map