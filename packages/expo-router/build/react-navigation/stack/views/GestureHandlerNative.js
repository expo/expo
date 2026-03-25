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
exports.GestureState = exports.GestureHandlerRootView = void 0;
exports.PanGestureHandler = PanGestureHandler;
const React = __importStar(require("react"));
const react_native_gesture_handler_1 = require("react-native-gesture-handler");
const GestureHandlerRefContext_1 = require("../utils/GestureHandlerRefContext");
function PanGestureHandler(props) {
    const gestureRef = React.useRef(null);
    return (<GestureHandlerRefContext_1.GestureHandlerRefContext.Provider value={gestureRef}>
      <react_native_gesture_handler_1.PanGestureHandler {...props} ref={gestureRef}/>
    </GestureHandlerRefContext_1.GestureHandlerRefContext.Provider>);
}
var react_native_gesture_handler_2 = require("react-native-gesture-handler");
Object.defineProperty(exports, "GestureHandlerRootView", { enumerable: true, get: function () { return react_native_gesture_handler_2.GestureHandlerRootView; } });
Object.defineProperty(exports, "GestureState", { enumerable: true, get: function () { return react_native_gesture_handler_2.State; } });
//# sourceMappingURL=GestureHandlerNative.js.map