import { ClipboardUnavailableException, CopyFailureException, NoPermissionException, PasteFailureException, } from './WebExceptions';
import { base64toBlob, blobToBase64Async, findImageInClipboardAsync, getImageSizeFromBlobAsync, isClipboardPermissionDeniedAsync, } from './WebUtils';
export default {
    get name() {
        return 'ExpoClipboard';
    },
    async getStringAsync(_options) {
        if (!navigator.clipboard) {
            throw new ClipboardUnavailableException();
        }
        let text = '';
        try {
            text = await navigator.clipboard.readText();
        }
        catch (e) {
            // it might fail, because user denied permission
            if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
                throw new NoPermissionException();
            }
            try {
                // Internet Explorer
                // @ts-ignore
                text = window.clipboardData.getData('Text');
            }
            catch {
                return Promise.reject(new Error('Unable to retrieve item from clipboard'));
            }
        }
        return text;
    },
    // TODO: (barthap) The `setString` was deprecated in SDK 45. Remove this function in a few SDK cycles.
    setString(text) {
        const textField = document.createElement('textarea');
        textField.textContent = text;
        document.body.appendChild(textField);
        textField.select();
        try {
            document.execCommand('copy');
            return true;
        }
        catch {
            return false;
        }
        finally {
            document.body.removeChild(textField);
        }
    },
    async setStringAsync(text, _options) {
        return this.setString(text);
    },
    async hasStringAsync() {
        return this.getStringAsync({}).then((text) => text.length > 0);
    },
    async getImageAsync(_options) {
        if (!navigator.clipboard) {
            throw new ClipboardUnavailableException();
        }
        try {
            const clipboardItems = await navigator.clipboard.read();
            const blob = await findImageInClipboardAsync(clipboardItems);
            if (!blob) {
                return null;
            }
            const [data, size] = await Promise.all([
                blobToBase64Async(blob),
                getImageSizeFromBlobAsync(blob),
            ]);
            return { data, size };
        }
        catch (e) {
            // it might fail, because user denied permission
            if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
                throw new NoPermissionException();
            }
            throw new PasteFailureException(e.message);
        }
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
                // I cannot use `@ts-expect-error` here because some environments consider this correct:
                // expo-module build - OK,
                // et gdad - error
                // Fixed in TS >4.4.3: https://github.com/microsoft/TypeScript/issues/46116#issuecomment-932443415
                // @ts-ignore Some tools seem to use TS <= 4.4.3
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
        try {
            const clipboardItems = await navigator.clipboard.read();
            return clipboardItems
                .flatMap((item) => item.types)
                .some((type) => type === 'image/png' || type === 'image/jpeg');
        }
        catch (e) {
            // it might fail, because user denied permission
            if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
                throw new NoPermissionException();
            }
            throw e;
        }
    },
    addClipboardListener() { },
    removeClipboardListener() { },
};
//# sourceMappingURL=ExpoClipboard.js.map