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
exports.CardA11yWrapper = void 0;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
exports.CardA11yWrapper = React.forwardRef(({ focused, active, animated, isNextScreenTransparent, detachCurrentScreen, children }, ref) => {
    // Manage this in separate component to avoid re-rendering card during gestures
    // Otherwise the gesture animation will be interrupted as state hasn't updated yet
    const [inert, setInert] = React.useState(false);
    React.useImperativeHandle(ref, () => ({ setInert }), []);
    const isHidden = !animated && isNextScreenTransparent === false && detachCurrentScreen !== false && !focused;
    return (<react_native_1.View aria-hidden={!focused} pointerEvents={(animated ? inert : !focused) ? 'none' : 'box-none'} style={[
            react_native_1.StyleSheet.absoluteFill,
            {
                // This is necessary to avoid unfocused larger pages increasing scroll area
                // The issue can be seen on the web when a smaller screen is pushed over a larger one
                overflow: active ? undefined : 'hidden',
                // We use visibility on web
                display: react_native_1.Platform.OS !== 'web' && isHidden ? 'none' : 'flex',
                // Hide unfocused screens when animation isn't enabled
                // This is also necessary for a11y on web
                visibility: isHidden ? 'hidden' : 'visible',
            },
        ]} 
    // Make sure this view is not removed on the new architecture, as it causes focus loss during navigation on Android.
    // This can happen when the view flattening results in different trees - due to `overflow` style changing in a parent.
    collapsable={false}>
        {children}
      </react_native_1.View>);
});
exports.CardA11yWrapper.displayName = 'CardA11yWrapper';
//# sourceMappingURL=CardA11yWrapper.js.map