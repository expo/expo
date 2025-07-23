"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortedRoutes = getSortedRoutes;
const Route_1 = require("../Route");
function getSortedRoutes() {
    if (!this.routeNode) {
        throw new Error('No routes found');
    }
    return this.routeNode.children.filter((route) => !route.internal).sort(Route_1.sortRoutes);
}
//# sourceMappingURL=sort-routes.js.map