export default {
    get name() {
        return 'ExpoRandom';
    },
    getRandomBytes(length) {
        const array = new Uint8Array(length);
        return window.crypto.getRandomValues(array);
    },
    async getRandomBytesAsync(length) {
        const array = new Uint8Array(length);
        return window.crypto.getRandomValues(array);
    },
};
//# sourceMappingURL=ExpoRandom.web.js.map