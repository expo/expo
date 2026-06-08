"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStandardState = useStandardState;
const react_1 = require("react");
const getPreloadedRoutes_1 = require("./getPreloadedRoutes");
const useBuildHref_1 = require("./useBuildHref");
function useStandardState(builderState) {
    const buildHref = (0, useBuildHref_1.useBuildHref)();
    return (0, react_1.useMemo)(() => {
        // TODO(@ubax): https://linear.app/expo/issue/ENG-21638/merge-preloaded-and-active-routes-into-single-array
        // Stack states keep preloaded routes in a separate `preloadedRoutes` array. The standard
        // contract has no such concept, so they are projected as regular routes positioned after
        // `index`
        const routes = [...builderState.routes, ...(0, getPreloadedRoutes_1.getPreloadedRoutes)(builderState)];
        return {
            index: builderState.index,
            routes: routes.map((route) => ({
                href: buildHref(route),
                key: route.key,
                name: route.name,
                params: route.params,
            })),
        };
    }, [builderState, buildHref]);
}
//# sourceMappingURL=useStandardState.js.map