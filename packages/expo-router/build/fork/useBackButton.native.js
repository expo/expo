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
exports.useBackButton = void 0;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
function useBackButton(ref) {
    React.useEffect(() => {
        const subscription = react_native_1.BackHandler.addEventListener('hardwareBackPress', () => {
            const navigation = ref.current;
            if (navigation == null) {
                return false;
            }
            if (navigation.canGoBack()) {
                navigation.goBack();
                return true;
            }
            return false;
        });
        return () => subscription.remove();
    }, [ref]);
}
exports.useBackButton = useBackButton;
//# sourceMappingURL=useBackButton.native.js.map