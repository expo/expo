"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withAndroidWidgets_1 = __importDefault(require("./android/withAndroidWidgets"));
const withIosWidgets_1 = __importDefault(require("./ios/withIosWidgets"));
const pkg = require('../../package.json');
const withWidgets = (config, props) => {
    const widgets = props?.widgets ?? [];
    return (0, config_plugins_1.withPlugins)(config, [
        [withAndroidWidgets_1.default, { widgets }],
        [withIosWidgets_1.default, { ...(props ?? {}), widgets }],
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withWidgets, pkg.name, pkg.version);
