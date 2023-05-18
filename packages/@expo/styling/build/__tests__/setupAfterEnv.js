"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const matchers_1 = __importDefault(require("expect/build/matchers"));
require("react-native-reanimated/lib/reanimated2/jestUtils").setUpTests();
matchers_1.default.customTesters = [];
expect.extend({
    styleToEqual(received, style) {
        const receivedStyle = received.component.mock.lastCall[0].style;
        return matchers_1.default.toEqual(receivedStyle, style);
    },
});
//# sourceMappingURL=setupAfterEnv.js.map