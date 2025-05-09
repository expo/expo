"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useExpoRouterStore = exports.StoreContext = void 0;
const react_1 = require("react");
exports.StoreContext = (0, react_1.createContext)(null);
const useExpoRouterStore = () => (0, react_1.use)(exports.StoreContext);
exports.useExpoRouterStore = useExpoRouterStore;
//# sourceMappingURL=storeContext.js.map