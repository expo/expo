import { getFilename } from './AssetUris';
export function isImageType(type) {
    return /^(jpeg|jpg|gif|png|bmp|webp|heic)$/i.test(type);
}
export function getImageInfoAsync(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
            resolve({
                name: getFilename(url),
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
        };
        img.src = url;
    });
}
//# sourceMappingURL=ImageAssets.js.map