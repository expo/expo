"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const Screen_1 = require("../views/Screen");
const Stack = (() => {
    if (process.env.EXPO_PUBLIC_EXPERIMENTAL_WEB_MODAL === '1') {
        return require('./ExperimentalModalStack').default;
    }
    return require('./BaseStack').default;
})();
exports.Stack = Stack;
Stack.Screen = Screen_1.Screen;
exports.default = Stack;
//# sourceMappingURL=Stack.web.js.map