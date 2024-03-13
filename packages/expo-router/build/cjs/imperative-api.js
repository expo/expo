"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.router = void 0;
function _routerStore() {
  const data = require("./global-state/router-store");
  _routerStore = function () {
    return data;
  };
  return data;
}
const router = exports.router = {
  navigate: href => _routerStore().store.navigate(href),
  push: href => _routerStore().store.push(href),
  dismiss: count => _routerStore().store.dismiss(count),
  dismissAll: () => _routerStore().store.dismissAll(),
  canDismiss: () => _routerStore().store.canDismiss(),
  replace: href => _routerStore().store.replace(href),
  back: () => _routerStore().store.goBack(),
  canGoBack: () => _routerStore().store.canGoBack(),
  setParams: params => _routerStore().store.setParams(params)
};
//# sourceMappingURL=imperative-api.js.map