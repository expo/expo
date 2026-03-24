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
exports.useRoutePath = useRoutePath;
const React = __importStar(require("react"));
const core_1 = require("../core");
const LinkingContext_1 = require("./LinkingContext");
/**
 * Hook to get the path for the current route based on linking options.
 *
 * @returns Path for the current route.
 */
function useRoutePath() {
    const { options } = React.useContext(LinkingContext_1.LinkingContext);
    const state = (0, core_1.useStateForPath)();
    if (state === undefined) {
        throw new Error("Couldn't find a state for the route object. Is your component inside a screen in a navigator?");
    }
    const getPathFromStateHelper = options?.getPathFromState ?? core_1.getPathFromState;
    const path = React.useMemo(() => {
        if (options?.enabled === false) {
            return undefined;
        }
        const path = getPathFromStateHelper(state, options?.config);
        return path;
    }, [options?.enabled, options?.config, state, getPathFromStateHelper]);
    return path;
}
//# sourceMappingURL=useRoutePath.js.map