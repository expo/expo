export default {
    async canAddPassesAsync() {
        return new Promise(resolve => {
            resolve(true);
        });
    },
    async addPassFromUrlAsync(url) {
        window.open(url);
        return new Promise(resolve => {
            resolve(true);
        });
    },
};
//# sourceMappingURL=ExpoWallet.web.js.map