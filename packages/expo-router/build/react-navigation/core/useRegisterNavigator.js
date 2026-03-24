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
exports.useRegisterNavigator = useRegisterNavigator;
const non_secure_1 = require("nanoid/non-secure");
const React = __importStar(require("react"));
const EnsureSingleNavigator_1 = require("./EnsureSingleNavigator");
/**
 * Register a navigator in the parent context (either a navigation container or a screen).
 * This is used to prevent multiple navigators under a single container or screen.
 */
function useRegisterNavigator() {
    const [key] = React.useState(() => (0, non_secure_1.nanoid)());
    const container = React.useContext(EnsureSingleNavigator_1.SingleNavigatorContext);
    if (container === undefined) {
        throw new Error("Couldn't register the navigator. Have you wrapped your app with 'NavigationContainer'?\n\nThis can also happen if there are multiple copies of '@react-navigation' packages installed.");
    }
    React.useEffect(() => {
        const { register, unregister } = container;
        register(key);
        return () => unregister(key);
    }, [container, key]);
    return key;
}
//# sourceMappingURL=useRegisterNavigator.js.map