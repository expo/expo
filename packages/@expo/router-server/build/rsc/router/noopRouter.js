"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createPages_1 = require("./createPages");
// Used in client-only mode to skip route loading in react-server bundles.
exports.default = (_getRouteOptions) => ({
    default: (0, createPages_1.createPages)(async () => { }),
});
//# sourceMappingURL=noopRouter.js.map