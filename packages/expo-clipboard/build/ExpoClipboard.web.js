import { CodedError } from 'expo-modules-core';
class ClipboardUnavailableException extends CodedError {
    constructor() {
        super('ERR_CLIPBOARD_UNAVAILABLE', "The 'AsyncClipboard' API is not available on this browser.");
    }
}
class CopyFailureException extends CodedError {
    constructor(cause) {
        super('ERR_COPY_FAILURE', `Failed to copy to clipboard: ${cause}`);
    }
}
/**
 * Converts base64-encoded data to a `Blob` object.
 * @see https://stackoverflow.com/a/20151856
 */
function base64toBlob(base64Data, contentType) {
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
    return new Blob(byteArrays, { type: contentType });
}
/**
 * Converts blob to base64-encoded string with Data-URL prefix.
 */
function blobToBase64Async(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}
function getImageSizeFromBlobAsync(blob) {
    return new Promise((resolve, _) => {
        const blobUrl = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = blobUrl;
        img.onload = function () {
            resolve([img.width, img.height]);
        };
    });
}
async function findImageInClipboardAsync(items) {
    for (const clipboardItem of items) {
        // first look for png
        if (clipboardItem.types.some((type) => type === 'image/png')) {
            return await clipboardItem.getType('image/png');
        }
        // alternatively, an image might be a jpeg
        if (clipboardItem.types.some((type) => type === 'image/jpeg')) {
            return await clipboardItem.getType('image/jpeg');
        }
    }
    return null;
}
export default {
    get name() {
        return 'ExpoClipboard';
    },
    async getStringAsync(_options) {
        let text = '';
        try {
            text = await navigator.clipboard.readText();
        }
        catch {
            try {
                // Internet Explorer
                // @ts-ignore
                text = window.clipboardData.getData('Text');
            }
            catch {
                return Promise.reject(new Error('Unable to retrieve item from clipboard.'));
            }
        }
        return text;
    },
    setString(text) {
        let success = false;
        const textField = document.createElement('textarea');
        textField.textContent = text;
        document.body.appendChild(textField);
        textField.select();
        try {
            document.execCommand('copy');
            success = true;
        }
        catch { }
        document.body.removeChild(textField);
        return success;
    },
    async setStringAsync(text, _options) {
        return this.setString(text);
    },
    async getImageAsync(options) {
        if (!navigator.clipboard) {
            throw new ClipboardUnavailableException();
        }
        const clipboardItems = await navigator.clipboard.read();
        const blob = await findImageInClipboardAsync(clipboardItems);
        if (!blob) {
            return null;
        }
        const [data, [width, height]] = await Promise.all([
            blobToBase64Async(blob),
            getImageSizeFromBlobAsync(blob),
        ]);
        return {
            data,
            size: { width, height },
        };
    },
    async setImageAsync(base64image) {
        if (!navigator.clipboard) {
            throw new ClipboardUnavailableException();
        }
        try {
            // we set it always to `image/png` because it's the only format supported by the clipboard
            // but it seems to work even when provided jpeg data
            const blob = base64toBlob(base64image, 'image/png');
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                }),
            ]);
        }
        catch (err) {
            throw new CopyFailureException(err.message);
        }
    },
    async hasImageAsync() {
        if (!navigator.clipboard) {
            throw new ClipboardUnavailableException();
        }
        const clipboardItems = await navigator.clipboard.read();
        return clipboardItems
            .flatMap((item) => item.types)
            .some((type) => type === 'image/png' || type === 'image/jpeg');
    },
    addClipboardListener() { },
    removeClipboardListener() { },
};
//# sourceMappingURL=ExpoClipboard.web.js.map