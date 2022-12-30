// adapted from https://gist.github.com/ngbrown/d62eb518753378eb0a9bf02bb4723235
// modified from https://gist.github.com/WorldMaker/a3cbe0059acd827edee568198376b95a
// https://github.com/woltapp/react-blurhash/issues/3
import { useEffect, useState } from 'react';
import decode from './decode';
export function useBlurhash(blurhash, width = 32, height = 32, punch = 1) {
    punch = punch || 1;
    const [url, setUrl] = useState(null);
    useEffect(() => {
        let isCanceled = false;
        if (!blurhash)
            return;
        const pixels = decode(blurhash, width, height, punch);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        const imageData = context.createImageData(width, height);
        imageData.data.set(pixels);
        context.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
            if (!isCanceled) {
                setUrl((oldUrl) => {
                    if (oldUrl) {
                        URL.revokeObjectURL(oldUrl);
                    }
                    return blob ? URL.createObjectURL(blob) : oldUrl;
                });
            }
        });
        return function cleanupBlurhash() {
            isCanceled = true;
            setUrl((oldUrl) => {
                if (oldUrl) {
                    URL.revokeObjectURL(oldUrl);
                }
                return null;
            });
        };
    }, [blurhash, height, width, punch]);
    return url;
}
//# sourceMappingURL=useBlurhash.js.map