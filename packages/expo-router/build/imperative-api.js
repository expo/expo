"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const router_store_1 = require("./global-state/router-store");
exports.router = {
    navigate: (href) => router_store_1.store.navigate(href),
    push: (href) => router_store_1.store.push(href),
    dismiss: (count) => router_store_1.store.dismiss(count),
    dismissAll: () => router_store_1.store.dismissAll(),
    canDismiss: () => router_store_1.store.canDismiss(),
    replace: (href) => router_store_1.store.replace(href),
    back: () => router_store_1.store.goBack(),
    canGoBack: () => router_store_1.store.canGoBack(),
    setParams: (params) => router_store_1.store.setParams(params),
};
//# sourceMappingURL=imperative-api.js.map