export default {
    get name() {
        return 'ExpoRandom';
    },
    async getRandomIntegerAsync(length) {
        const array = new Uint8Array(length);
        return window.crypto.getRandomValues(array);
    },
};
//# sourceMappingURL=ExpoRandom.web.js.map