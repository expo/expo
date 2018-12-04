export default {
    get name() {
        return 'ExponentPrint';
    },
    get Orientation() {
        return {
            portrait: 'portrait',
            landscape: 'landscape',
        };
    },
    async print() {
        window.print();
    },
    async printToFileAsync() {
        window.print();
    },
};
//# sourceMappingURL=ExponentPrint.web.js.map