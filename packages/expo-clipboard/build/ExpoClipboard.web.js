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
    async hasStringAsync() {
        return this.getStringAsync({}).then((text) => text.length > 0);
    },
    addClipboardListener() { },
    removeClipboardListener() { },
};
//# sourceMappingURL=ExpoClipboard.web.js.map