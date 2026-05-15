"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicateRouteNames = checkDuplicateRouteNames;
function checkDuplicateRouteNames(state) {
    const duplicates = [];
    const getRouteNames = (location, state) => {
        state.routes.forEach((route) => {
            const currentLocation = location ? `${location} > ${route.name}` : route.name;
            route.state?.routeNames?.forEach((routeName) => {
                if (routeName === route.name) {
                    duplicates.push([currentLocation, `${currentLocation} > ${route.name}`]);
                }
            });
            if (route.state) {
                getRouteNames(currentLocation, route.state);
            }
        });
    };
    getRouteNames('', state);
    return duplicates;
}
//# sourceMappingURL=checkDuplicateRouteNames.js.map