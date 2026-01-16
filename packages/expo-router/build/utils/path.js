"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimplePathDataFromState = getSimplePathDataFromState;
function getSimplePathDataFromState(state) {
    const segments = [];
    const params = {};
    let current = state;
    while (current) {
        const currentRoute = current.routes?.[current.index ?? 0];
        if (currentRoute) {
            if (currentRoute.name) {
                segments.push(currentRoute.name);
            }
            if (currentRoute.params) {
                for (const key in currentRoute.params) {
                    const value = currentRoute.params?.[key];
                    if (value) {
                        params[key] = value;
                    }
                }
            }
            current = currentRoute.state;
        }
    }
    return {
        pathname: '/' + segments.join('/'),
        params,
    };
}
//# sourceMappingURL=path.js.map