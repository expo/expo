"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_pages_1 = require("./create-pages");
exports.default = (0, create_pages_1.createPages)(async () => {
    // noop the router for client-only mode. This ensures we skip loading the routes in react-server mode.
});
//# sourceMappingURL=noopRouter.js.map