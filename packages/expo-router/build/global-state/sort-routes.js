import { sortRoutes } from '../Route';
export function getSortedRoutes() {
    if (!this.routeNode) {
        throw new Error('No routes found');
    }
    return this.routeNode.children.filter((route) => !route.internal).sort(sortRoutes);
}
//# sourceMappingURL=sort-routes.js.map