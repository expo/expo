"use strict";
// Re-export shim — preserves all existing import paths.
// TODO: Refactor consumers to import directly from the new modules, then delete this file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayloadFromStateRoute = exports.findDivergentState = exports.prefetch = exports.reload = exports.linkTo = exports.setParams = exports.canDismiss = exports.canGoBack = exports.goBack = exports.dismissAll = exports.dismissTo = exports.dismiss = exports.replace = exports.push = exports.navigate = exports.routingQueue = void 0;
var routingQueue_1 = require("./routingQueue");
Object.defineProperty(exports, "routingQueue", { enumerable: true, get: function () { return routingQueue_1.routingQueue; } });
var router_1 = require("./router");
Object.defineProperty(exports, "navigate", { enumerable: true, get: function () { return router_1.navigate; } });
Object.defineProperty(exports, "push", { enumerable: true, get: function () { return router_1.push; } });
Object.defineProperty(exports, "replace", { enumerable: true, get: function () { return router_1.replace; } });
Object.defineProperty(exports, "dismiss", { enumerable: true, get: function () { return router_1.dismiss; } });
Object.defineProperty(exports, "dismissTo", { enumerable: true, get: function () { return router_1.dismissTo; } });
Object.defineProperty(exports, "dismissAll", { enumerable: true, get: function () { return router_1.dismissAll; } });
Object.defineProperty(exports, "goBack", { enumerable: true, get: function () { return router_1.goBack; } });
Object.defineProperty(exports, "canGoBack", { enumerable: true, get: function () { return router_1.canGoBack; } });
Object.defineProperty(exports, "canDismiss", { enumerable: true, get: function () { return router_1.canDismiss; } });
Object.defineProperty(exports, "setParams", { enumerable: true, get: function () { return router_1.setParams; } });
Object.defineProperty(exports, "linkTo", { enumerable: true, get: function () { return router_1.linkTo; } });
Object.defineProperty(exports, "reload", { enumerable: true, get: function () { return router_1.reload; } });
Object.defineProperty(exports, "prefetch", { enumerable: true, get: function () { return router_1.prefetch; } });
var stateUtils_1 = require("./stateUtils");
Object.defineProperty(exports, "findDivergentState", { enumerable: true, get: function () { return stateUtils_1.findDivergentState; } });
Object.defineProperty(exports, "getPayloadFromStateRoute", { enumerable: true, get: function () { return stateUtils_1.getPayloadFromStateRoute; } });
//# sourceMappingURL=routing.js.map