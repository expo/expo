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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInvalidPreventRemoveError = useInvalidPreventRemoveError;
const React = __importStar(require("react"));
const native_1 = require("../../native");
function useInvalidPreventRemoveError(descriptors) {
    const { preventedRoutes } = (0, native_1.usePreventRemoveContext)();
    const preventedRouteKey = Object.keys(preventedRoutes)[0];
    const preventedDescriptor = descriptors[preventedRouteKey];
    const isHeaderBackButtonMenuEnabledOnPreventedScreen = preventedDescriptor?.options?.headerBackButtonMenuEnabled;
    const preventedRouteName = preventedDescriptor?.route?.name;
    React.useEffect(() => {
        if (preventedRouteKey != null && isHeaderBackButtonMenuEnabledOnPreventedScreen) {
            const message = `The screen ${preventedRouteName} uses 'usePreventRemove' hook alongside 'headerBackButtonMenuEnabled: true', which is not supported. \n\n` +
                `Consider removing 'headerBackButtonMenuEnabled: true' from ${preventedRouteName} screen to get rid of this error.`;
            console.error(message);
        }
    }, [preventedRouteKey, isHeaderBackButtonMenuEnabledOnPreventedScreen, preventedRouteName]);
}
//# sourceMappingURL=useInvalidPreventRemoveError.js.map