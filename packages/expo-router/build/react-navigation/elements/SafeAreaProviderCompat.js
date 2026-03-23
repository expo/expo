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
exports.SafeAreaProviderCompat = SafeAreaProviderCompat;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const useFrameSize_1 = require("./useFrameSize");
const { width = 0, height = 0 } = react_native_1.Dimensions.get('window');
// To support SSR on web, we need to have empty insets for initial values
// Otherwise there can be mismatch between SSR and client output
// We also need to specify empty values to support tests environments
const initialMetrics = react_native_1.Platform.OS === 'web' || react_native_safe_area_context_1.initialWindowMetrics == null
    ? {
        frame: { x: 0, y: 0, width, height },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }
    : react_native_safe_area_context_1.initialWindowMetrics;
function SafeAreaProviderCompat({ children, style }) {
    const insets = React.useContext(react_native_safe_area_context_1.SafeAreaInsetsContext);
    return (<useFrameSize_1.FrameSizeProvider initialFrame={initialMetrics.frame} render={({ ref, onLayout }) => {
            if (insets) {
                // If we already have insets, don't wrap the stack in another safe area provider
                // This avoids an issue with updates at the cost of potentially incorrect values
                // https://github.com/react-navigation/react-navigation/issues/174
                return (<react_native_1.View ref={ref} onLayout={onLayout} style={[styles.container, style]}>
              {children}
            </react_native_1.View>);
            }
            // SafeAreaProvider doesn't forward ref
            // So we only pass onLayout to it
            return (<react_native_safe_area_context_1.SafeAreaProvider initialMetrics={initialMetrics} style={style} onLayout={onLayout}>
            {children}
          </react_native_safe_area_context_1.SafeAreaProvider>);
        }}/>);
}
SafeAreaProviderCompat.initialMetrics = initialMetrics;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
});
//# sourceMappingURL=SafeAreaProviderCompat.js.map