"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProjectedDescriptors = useProjectedDescriptors;
const react_1 = require("react");
const getPreloadedRoutes_1 = require("./getPreloadedRoutes");
/**
 * Extends the descriptors map with descriptors for the preloaded routes.
 *
 * The standard state projects stack preloaded routes as regular routes after `index`
 * (see `useStandardState`), but `useNavigationBuilder` only describes `state.routes`.
 * Describing the preloaded routes here makes the standard `descriptors` cover every projected
 * route — `describe` stays private to the integration.
 *
 * @internal
 */
function useProjectedDescriptors(state, descriptors, describe) {
    const preloadedRoutes = (0, getPreloadedRoutes_1.getPreloadedRoutes)(state);
    return (0, react_1.useMemo)(() => {
        if (preloadedRoutes.length === 0) {
            return descriptors;
        }
        const result = { ...descriptors };
        for (const route of preloadedRoutes) {
            result[route.key] = result[route.key] ?? describe(route, true);
        }
        return result;
    }, [descriptors, preloadedRoutes, describe]);
}
//# sourceMappingURL=useProjectedDescriptors.js.map