export default {
    async canAddPassesAsync() {
        return true;
    },
    async addPassFromUrlAsync(url) {
        window.open(url);
        return true;
    },
};
//# sourceMappingURL=ExpoWallet.web.js.map