"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortRoutesWithInitial = exports.sortRoutes = void 0;
const matchers_1 = require("./matchers");
function sortDynamicConvention(a, b) {
    if (a.deep && !b.deep) {
        return 1;
    }
    if (!a.deep && b.deep) {
        return -1;
    }
    return 0;
}
function sortRoutes(a, b) {
    if (a.dynamic && !b.dynamic) {
        return 1;
    }
    if (!a.dynamic && b.dynamic) {
        return -1;
    }
    if (a.dynamic && b.dynamic) {
        if (a.dynamic.length !== b.dynamic.length) {
            return b.dynamic.length - a.dynamic.length;
        }
        for (let i = 0; i < a.dynamic.length; i++) {
            const aDynamic = a.dynamic[i];
            const bDynamic = b.dynamic[i];
            if (aDynamic.notFound && bDynamic.notFound) {
                const s = sortDynamicConvention(aDynamic, bDynamic);
                if (s) {
                    return s;
                }
            }
            if (aDynamic.notFound && !bDynamic.notFound) {
                return 1;
            }
            if (!aDynamic.notFound && bDynamic.notFound) {
                return -1;
            }
            const s = sortDynamicConvention(aDynamic, bDynamic);
            if (s) {
                return s;
            }
        }
        return 0;
    }
    const aIndex = a.route === 'index' || (0, matchers_1.matchGroupName)(a.route) != null;
    const bIndex = b.route === 'index' || (0, matchers_1.matchGroupName)(b.route) != null;
    if (aIndex && !bIndex) {
        return -1;
    }
    if (!aIndex && bIndex) {
        return 1;
    }
    return a.route.length - b.route.length;
}
exports.sortRoutes = sortRoutes;
function sortRoutesWithInitial(initialRouteName) {
    return (a, b) => {
        if (initialRouteName) {
            if (a.route === initialRouteName) {
                return -1;
            }
            if (b.route === initialRouteName) {
                return 1;
            }
        }
        return sortRoutes(a, b);
    };
}
exports.sortRoutesWithInitial = sortRoutesWithInitial;
//# sourceMappingURL=sortRoutes.js.map