"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drawer = void 0;
const DrawerClient_1 = __importDefault(require("./DrawerClient"));
exports.Drawer = DrawerClient_1.default;
const Screen_1 = require("../views/Screen");
DrawerClient_1.default.Screen = Screen_1.Screen;
exports.default = DrawerClient_1.default;
//# sourceMappingURL=Drawer.js.map