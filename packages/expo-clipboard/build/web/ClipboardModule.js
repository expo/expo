import { StringFormat, } from '../Clipboard.types';
import { ClipboardUnavailableException, CopyFailureException, NoPermissionException, PasteFailureException, } from './Exceptions';
import { base64toBlob, blobToBase64Async, findHtmlInClipboardAsync, findImageInClipboardAsync, getImageSizeFromBlobAsync, htmlToPlainText, isClipboardPermissionDeniedAsync, } from './Utils';
export default {
    get name() {
        return 'ExpoClipboard';
    },
    async getStringAsync(options) {
        if (!navigator.clipboard) {
            throw new ClipboardUnavailableException();
        }
        let text = '';
        try {
            switch (options.preferredFormat) {
                case StringFormat.HTML: {
                    const clipboardItems = await navigator.clipboard.read();
                    const blob = await findHtmlInClipboardAsync(clipboardItems);
                    if (!blob) {
                        return await navigator.clipboard.readText();
                    }
                    return await new Response(blob).text();
                }
                default: {
                    text = await navigator.clipboard.readText();
                    if (!text || text === '') {
                        const clipboardItems = await navigator.clipboard.read();
                        const blob = await findHtmlInClipboardAsync(clipboardItems);
                        text = (await blob?.text()) ?? '';
                        if (text.length > 0) {
                            text = htmlToPlainText(text);
                        }
                    }
                }
            }
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
    async setStringAsync(text, options) {
        switch (options.inputFormat) {
            case StringFormat.HTML: {
                if (!navigator.clipboard) {
                    throw new ClipboardUnavailableException();
                }
                try {
                    const clipboardItemInput = new ClipboardItem({
                        // @ts-ignore `Blob` from `lib.dom.d.ts` and the one from `@types/react-native` differ
                        'text/html': new Blob([text], { type: 'text/html' }),
                        // @ts-ignore `Blob` from `lib.dom.d.ts` and the one from `@types/react-native` differ
                        'text/plain': new Blob([htmlToPlainText(text)], { type: 'text/plain' }),
                    });
                    await navigator.clipboard.write([clipboardItemInput]);
                    return true;
                }
                catch (e) {
                    // it might fail, because user denied permission
                    if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
                        throw new NoPermissionException();
                    }
                    throw new CopyFailureException(e.message);
                }
            }
            default:
                return this.setString(text);
        }
    },
    async hasStringAsync() {
        if (!navigator.clipboard) {
            throw new ClipboardUnavailableException();
        }
        try {
            const clipboardItems = await navigator.clipboard.read();
            return clipboardItems
                .flatMap((item) => item.types)
                .some((type) => type === 'text/plain' || type === 'text/html');
        }
        catch (e) {
            // it might fail, because user denied permission
            if (e.name === 'NotAllowedError' || (await isClipboardPermissionDeniedAsync())) {
                throw new NoPermissionException();
            }
            throw e;
        }
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
//# sourceMappingURL=ClipboardModule.js.map