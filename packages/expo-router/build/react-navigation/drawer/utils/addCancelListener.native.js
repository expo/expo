"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCancelListener = void 0;
const react_native_1 = require("react-native");
const addCancelListener = (callback) => {
    const subscription = react_native_1.BackHandler.addEventListener('hardwareBackPress', callback);
    return () => {
        subscription.remove();
    };
};
exports.addCancelListener = addCancelListener;
//# sourceMappingURL=addCancelListener.native.js.map