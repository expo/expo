/**
 * Converts base64-encoded data to a `Blob` object.
 * @see https://stackoverflow.com/a/20151856
 */
export function base64toBlob(base64Data, contentType) {
    contentType = contentType || '';
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);
    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        const begin = sliceIndex * sliceSize;
        const end = Math.min(begin + sliceSize, bytesLength);
        const bytes = new Array(end - begin);
        for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    // I cannot use `@ts-expect-error` here because some environments consider this correct:
    // expo-module build - OK,
    // expo-module test - error
    // @ts-ignore `Blob` from `lib.dom.d.ts` and the one from `@types/react-native` differ somehow
    return new Blob(byteArrays, { type: contentType });
}
/**
 * Converts blob to base64-encoded string with Data-URL prefix.
 */
export function blobToBase64Async(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}
export function htmlToPlainText(html) {
    const tempDivElement = document.createElement('div');
    tempDivElement.innerHTML = html;
    return tempDivElement.textContent || tempDivElement.innerText || '';
}
export function getImageSizeFromBlobAsync(blob) {
    return new Promise((resolve, _) => {
        const blobUrl = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = blobUrl;
        img.onload = function () {
            resolve({ width: img.width, height: img.height });
        };
    });
}
export async function findImageInClipboardAsync(items) {
    for (const clipboardItem of items) {
        // first look for png
        if (clipboardItem.types.some((type) => type === 'image/png')) {
            return await clipboardItem.getType('image/png');
        }
        // alternatively, an image might be a jpeg
        // NOTE: Currently, this is not supported by browsers yet. They only support PNG now
        if (clipboardItem.types.some((type) => type === 'image/jpeg')) {
            return await clipboardItem.getType('image/jpeg');
        }
    }
    return null;
}
export async function findHtmlInClipboardAsync(items) {
    for (const clipboardItem of items) {
        if (clipboardItem.types.some((type) => type === 'text/html')) {
            return await clipboardItem.getType('text/html');
        }
    }
    return null;
}
export async function isClipboardPermissionDeniedAsync() {
    const queryOpts = { name: 'clipboard-read' };
    const permissionStatus = await navigator.permissions.query(queryOpts);
    return permissionStatus.state === 'denied';
}
//# sourceMappingURL=Utils.js.map