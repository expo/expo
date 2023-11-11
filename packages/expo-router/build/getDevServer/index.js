"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevServer = void 0;
const getDevServer = () => {
    return {
        url: typeof location === 'undefined' ? '' : location.origin + '/',
    };
};
exports.getDevServer = getDevServer;
//# sourceMappingURL=index.js.map