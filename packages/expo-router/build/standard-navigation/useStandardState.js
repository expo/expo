"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStandardState = useStandardState;
const react_1 = require("react");
const useBuildHref_1 = require("./useBuildHref");
function useStandardState(builderState) {
    const buildHref = (0, useBuildHref_1.useBuildHref)();
    return (0, react_1.useMemo)(() => ({
        index: builderState.index,
        routes: builderState.routes.map((route) => ({
            href: buildHref(route),
            key: route.key,
            name: route.name,
            params: route.params,
        })),
    }), [builderState, buildHref]);
}
//# sourceMappingURL=useStandardState.js.map