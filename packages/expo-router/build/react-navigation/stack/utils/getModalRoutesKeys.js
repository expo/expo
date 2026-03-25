"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModalRouteKeys = void 0;
const getModalRouteKeys = (routes, descriptors) => routes.reduce((acc, route) => {
    const { presentation } = descriptors[route.key]?.options ?? {};
    if ((acc.length && !presentation) ||
        presentation === 'modal' ||
        presentation === 'transparentModal') {
        acc.push(route.key);
    }
    return acc;
}, []);
exports.getModalRouteKeys = getModalRouteKeys;
//# sourceMappingURL=getModalRoutesKeys.js.map