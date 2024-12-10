"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const router_store_1 = require("./global-state/router-store");
/**
 * @hidden
 */
exports.router = {
    navigate: (href, options) => router_store_1.store.navigate(href, options),
    push: (href, options) => router_store_1.store.push(href, options),
    dismiss: (count) => router_store_1.store.dismiss(count),
    dismissAll: () => router_store_1.store.dismissAll(),
    dismissTo: (href, options) => router_store_1.store.dismissTo(href, options),
    canDismiss: () => router_store_1.store.canDismiss(),
    replace: (href, options) => router_store_1.store.replace(href, options),
    back: () => router_store_1.store.goBack(),
    canGoBack: () => router_store_1.store.canGoBack(),
    setParams: (params) => router_store_1.store.setParams(params),
    reload: () => router_store_1.store.reload(),
};
//# sourceMappingURL=imperative-api.js.map