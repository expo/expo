"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tabs = void 0;
const TabsClient_1 = __importDefault(require("./TabsClient"));
exports.Tabs = TabsClient_1.default;
const Screen_1 = require("../views/Screen");
TabsClient_1.default.Screen = Screen_1.Screen;
exports.default = TabsClient_1.default;
//# sourceMappingURL=Tabs.js.map