"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconstructState = void 0;
const queryString = __importStar(require("query-string"));
function reconstructState(state, getState, options) {
    const segments = [];
    const allParams = {};
    while (state?.routes?.length) {
        const route = state.routes[state.routes.length - 1];
        segments.push(...route.name.split('/'));
        state = route.state;
        if (route.params) {
            const { screen, params, ...other } = route.params;
            Object.assign(allParams, other);
            if (screen) {
                state = {
                    routeNames: [screen],
                    routes: [{ name: screen, params }],
                };
            }
        }
    }
    if (segments.length && segments[segments.length - 1] === 'index') {
        segments.pop();
    }
    let path = `/${segments.filter(Boolean).join('/')}`;
    const query = queryString.stringify(allParams, { sort: false });
    if (query) {
        path += `?${query}`;
    }
    return getState(path, options);
}
exports.reconstructState = reconstructState;
//# sourceMappingURL=routeInfo.js.map