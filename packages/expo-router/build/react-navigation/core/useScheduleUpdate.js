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
exports.useScheduleUpdate = useScheduleUpdate;
const React = __importStar(require("react"));
const NavigationBuilderContext_1 = require("./NavigationBuilderContext");
const useClientLayoutEffect_1 = require("./useClientLayoutEffect");
/**
 * When screen config changes, we want to update the navigator in the same update phase.
 * However, navigation state is in the root component and React won't let us update it from a child.
 * This is a workaround for that, the scheduled update is stored in the ref without actually calling setState.
 * It lets all subsequent updates access the latest state so it stays correct.
 * Then we call setState during after the component updates.
 */
function useScheduleUpdate(callback) {
    const { scheduleUpdate, flushUpdates } = React.useContext(NavigationBuilderContext_1.NavigationBuilderContext);
    // FIXME: This is potentially unsafe
    // However, since we are using sync store, it might be fine
    scheduleUpdate(callback);
    (0, useClientLayoutEffect_1.useClientLayoutEffect)(flushUpdates);
}
//# sourceMappingURL=useScheduleUpdate.js.map