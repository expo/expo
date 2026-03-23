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
exports.NavigationIndependentTree = NavigationIndependentTree;
const React = __importStar(require("react"));
const NavigationContext_1 = require("./NavigationContext");
const NavigationIndependentTreeContext_1 = require("./NavigationIndependentTreeContext");
const NavigationProvider_1 = require("./NavigationProvider");
const useIsFocused_1 = require("./useIsFocused");
/**
 * Component to make the child navigation container independent of parent containers.
 */
function NavigationIndependentTree({ children }) {
    return (
    // We need to clear any existing contexts for nested independent container to work correctly
    <NavigationProvider_1.NavigationRouteContext.Provider value={undefined}>
      <NavigationContext_1.NavigationContext.Provider value={undefined}>
        <useIsFocused_1.IsFocusedContext.Provider value={undefined}>
          <NavigationIndependentTreeContext_1.NavigationIndependentTreeContext.Provider value>
            {children}
          </NavigationIndependentTreeContext_1.NavigationIndependentTreeContext.Provider>
        </useIsFocused_1.IsFocusedContext.Provider>
      </NavigationContext_1.NavigationContext.Provider>
    </NavigationProvider_1.NavigationRouteContext.Provider>);
}
//# sourceMappingURL=NavigationIndependentTree.js.map