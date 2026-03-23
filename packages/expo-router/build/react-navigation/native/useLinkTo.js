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
exports.useLinkTo = useLinkTo;
const React = __importStar(require("react"));
const core_1 = require("../core");
const useLinkBuilder_1 = require("./useLinkBuilder");
/**
 * Helper to navigate to a screen using a href based on the linking options.
 *
 * @returns function that receives the href to navigate to.
 */
function useLinkTo() {
    const navigation = React.useContext(core_1.NavigationContainerRefContext);
    const buildAction = (0, useLinkBuilder_1.useBuildAction)();
    const linkTo = React.useCallback((href) => {
        if (navigation === undefined) {
            throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
        }
        const action = buildAction(href);
        navigation.dispatch(action);
    }, [buildAction, navigation]);
    return linkTo;
}
//# sourceMappingURL=useLinkTo.js.map