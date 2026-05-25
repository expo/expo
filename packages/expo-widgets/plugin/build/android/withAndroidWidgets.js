"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const withAndroidWidgetFiles_1 = __importDefault(require("./withAndroidWidgetFiles"));
const withAndroidWidgetManifest_1 = __importDefault(require("./withAndroidWidgetManifest"));
const withAndroidWidgets = (config, { widgets }) => {
    if (widgets.length === 0) {
        return config;
    }
    const androidWidgets = widgets.filter((widget) => widget.android !== null);
    let nextConfig = config;
    if (androidWidgets.length > 0) {
        nextConfig = (0, withAndroidWidgetFiles_1.default)(nextConfig, androidWidgets);
    }
    return (0, withAndroidWidgetManifest_1.default)(nextConfig, androidWidgets);
};
exports.default = withAndroidWidgets;
