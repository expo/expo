"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopTabs = void 0;
const TopTabsClient_1 = __importDefault(require("./TopTabsClient"));
exports.TopTabs = TopTabsClient_1.default;
const Screen_1 = require("../views/Screen");
TopTabsClient_1.default.Screen = Screen_1.Screen;
exports.default = TopTabsClient_1.default;
//# sourceMappingURL=TopTabs.js.map