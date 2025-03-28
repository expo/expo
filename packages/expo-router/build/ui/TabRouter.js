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
exports.ExpoTabRouter = void 0;
const native_1 = require("@react-navigation/native");
const Linking = __importStar(require("expo-linking"));
function ExpoTabRouter({ triggerMap, ...options }) {
    const rnTabRouter = (0, native_1.TabRouter)(options);
    const router = {
        ...rnTabRouter,
        getStateForAction(state, action, options) {
            if (action.type !== 'JUMP_TO') {
                return rnTabRouter.getStateForAction(state, action, options);
            }
            const name = action.payload.name;
            const trigger = triggerMap[name];
            if (!trigger) {
                // This is probably for a different navigator
                return null;
            }
            else if (trigger.type === 'external') {
                Linking.openURL(trigger.href);
                return state;
            }
            const route = state.routes.find((route) => route.name === trigger.routeNode.route);
            if (!route) {
                // This shouldn't occur, but lets just hand it off to the next navigator in case.
                return null;
            }
            return rnTabRouter.getStateForRouteFocus(state, route.key);
        },
    };
    return router;
}
exports.ExpoTabRouter = ExpoTabRouter;
//# sourceMappingURL=TabRouter.js.map