"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationStoreContext = exports.RootTreeContext = exports.getRootNavigationStore = exports.setRootNavigationStore = exports.createNavigationStore = exports.replaceSliceByKey = exports.reset = exports.commitSlices = exports.replaceRoot = exports.seed = exports.navReducer = void 0;
var navReducer_1 = require("./navReducer");
Object.defineProperty(exports, "navReducer", { enumerable: true, get: function () { return navReducer_1.navReducer; } });
Object.defineProperty(exports, "seed", { enumerable: true, get: function () { return navReducer_1.seed; } });
Object.defineProperty(exports, "replaceRoot", { enumerable: true, get: function () { return navReducer_1.replaceRoot; } });
Object.defineProperty(exports, "commitSlices", { enumerable: true, get: function () { return navReducer_1.commitSlices; } });
Object.defineProperty(exports, "reset", { enumerable: true, get: function () { return navReducer_1.reset; } });
var replaceSliceByKey_1 = require("./replaceSliceByKey");
Object.defineProperty(exports, "replaceSliceByKey", { enumerable: true, get: function () { return replaceSliceByKey_1.replaceSliceByKey; } });
var navigationStore_1 = require("./navigationStore");
Object.defineProperty(exports, "createNavigationStore", { enumerable: true, get: function () { return navigationStore_1.createNavigationStore; } });
Object.defineProperty(exports, "setRootNavigationStore", { enumerable: true, get: function () { return navigationStore_1.setRootNavigationStore; } });
Object.defineProperty(exports, "getRootNavigationStore", { enumerable: true, get: function () { return navigationStore_1.getRootNavigationStore; } });
var contexts_1 = require("./contexts");
Object.defineProperty(exports, "RootTreeContext", { enumerable: true, get: function () { return contexts_1.RootTreeContext; } });
Object.defineProperty(exports, "NavigationStoreContext", { enumerable: true, get: function () { return contexts_1.NavigationStoreContext; } });
//# sourceMappingURL=index.js.map