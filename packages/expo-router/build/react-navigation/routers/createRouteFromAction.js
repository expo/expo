"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouteFromAction = createRouteFromAction;
const non_secure_1 = require("nanoid/non-secure");
const createParamsFromAction_1 = require("./createParamsFromAction");
function createRouteFromAction({ action, routeParamList }) {
    const { name } = action.payload;
    return {
        key: `${name}-${(0, non_secure_1.nanoid)()}`,
        name,
        params: (0, createParamsFromAction_1.createParamsFromAction)({ action, routeParamList }),
    };
}
//# sourceMappingURL=createRouteFromAction.js.map