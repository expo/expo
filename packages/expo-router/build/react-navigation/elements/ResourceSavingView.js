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
exports.ResourceSavingView = ResourceSavingView;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const FAR_FAR_AWAY = 30000; // this should be big enough to move the whole view out of its container
function ResourceSavingView({ visible, children, style, ...rest }) {
    if (react_native_1.Platform.OS === 'web') {
        return (<react_native_1.View 
        // @ts-expect-error: hidden exists on web, but not in React Native
        hidden={!visible} style={[{ display: visible ? 'flex' : 'none' }, styles.container, style]} pointerEvents={visible ? 'auto' : 'none'} {...rest}>
        {children}
      </react_native_1.View>);
    }
    return (<react_native_1.View style={[styles.container, style]} 
    // box-none doesn't seem to work properly on Android
    pointerEvents={visible ? 'auto' : 'none'}>
      <react_native_1.View collapsable={false} removeClippedSubviews={
        // On iOS & macOS, set removeClippedSubviews to true only when not focused
        // This is an workaround for a bug where the clipped view never re-appears
        react_native_1.Platform.OS === 'ios' || react_native_1.Platform.OS === 'macos' ? !visible : true} pointerEvents={visible ? 'auto' : 'none'} style={visible ? styles.attached : styles.detached}>
        {children}
      </react_native_1.View>
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    attached: {
        flex: 1,
    },
    detached: {
        flex: 1,
        top: FAR_FAR_AWAY,
    },
});
//# sourceMappingURL=ResourceSavingView.js.map