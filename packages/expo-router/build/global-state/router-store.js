"use strict";
// Re-export shim — preserves all existing import paths.
// TODO: Refactor consumers to import directly from the new modules, then delete this file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRouteInfo = exports.useStore = exports.store = void 0;
var store_1 = require("./store");
Object.defineProperty(exports, "store", { enumerable: true, get: function () { return store_1.store; } });
var useStore_1 = require("./useStore");
Object.defineProperty(exports, "useStore", { enumerable: true, get: function () { return useStore_1.useStore; } });
var useRouteInfo_1 = require("./useRouteInfo");
Object.defineProperty(exports, "useRouteInfo", { enumerable: true, get: function () { return useRouteInfo_1.useRouteInfo; } });
//# sourceMappingURL=router-store.js.map