"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSortedRoutes = getSortedRoutes;
function _Route() {
  const data = require("../Route");
  _Route = function () {
    return data;
  };
  return data;
}
function getSortedRoutes() {
  if (!this.routeNode) {
    throw new Error('No routes found');
  }
  return this.routeNode.children.filter(route => !route.internal).sort(_Route().sortRoutes);
}
//# sourceMappingURL=sort-routes.js.map