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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePreventRemove = usePreventRemove;
const non_secure_1 = require("nanoid/non-secure");
const React = __importStar(require("react"));
const useLatestCallback_1 = __importDefault(require("../../utils/useLatestCallback"));
const useNavigation_1 = require("./useNavigation");
const usePreventRemoveContext_1 = require("./usePreventRemoveContext");
const useRoute_1 = require("./useRoute");
/**
 * Hook to prevent screen from being removed. Can be used to prevent users from leaving the screen.
 *
 * @param preventRemove Boolean indicating whether to prevent screen from being removed.
 * @param callback Function which is executed when screen was prevented from being removed.
 */
function usePreventRemove(preventRemove, callback) {
    const [id] = React.useState(() => (0, non_secure_1.nanoid)());
    const navigation = (0, useNavigation_1.useNavigation)();
    const { key: routeKey } = (0, useRoute_1.useRoute)();
    const { setPreventRemove } = (0, usePreventRemoveContext_1.usePreventRemoveContext)();
    React.useEffect(() => {
        setPreventRemove(id, routeKey, preventRemove);
        return () => {
            setPreventRemove(id, routeKey, false);
        };
    }, [setPreventRemove, id, routeKey, preventRemove]);
    const beforeRemoveListener = (0, useLatestCallback_1.default)((e) => {
        if (!preventRemove) {
            return;
        }
        e.preventDefault();
        callback({ data: e.data });
    });
    React.useEffect(() => navigation?.addListener('beforeRemove', beforeRemoveListener), [navigation, beforeRemoveListener]);
}
//# sourceMappingURL=usePreventRemove.js.map