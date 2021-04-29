"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-expect-error missing types
const app_plugin_1 = __importDefault(require("expo-dev-launcher/app.plugin"));
// @ts-expect-error missing types
const app_plugin_2 = __importDefault(require("expo-dev-menu/app.plugin"));
function withDevClient(config) {
    config = app_plugin_2.default(config);
    config = app_plugin_1.default(config);
    return config;
}
exports.default = withDevClient;
