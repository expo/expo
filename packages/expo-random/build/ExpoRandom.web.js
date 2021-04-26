export default {
    get name() {
        return 'ExpoRandom';
    },
    getRandomBytes(length) {
        const array = new Uint8Array(length);
        // @ts-ignore
        return (window.crypto ?? window.msCrypto).getRandomValues(array);
    },
    async getRandomBytesAsync(length) {
        const array = new Uint8Array(length);
        // @ts-ignore
        return (window.crypto ?? window.msCrypto).getRandomValues(array);
    },
};
//# sourceMappingURL=ExpoRandom.web.js.map