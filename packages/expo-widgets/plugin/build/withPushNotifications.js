"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withInfoPlistValues_1 = __importDefault(require("./withInfoPlistValues"));
const withPushNotifications = (config, props) => (0, withInfoPlistValues_1.default)((0, config_plugins_1.withEntitlementsPlist)(config, (mod) => {
    mod.modResults['aps-environment'] = 'development';
    return mod;
}), {
    ExpoWidgets_EnablePushNotifications: props.enablePushNotifications,
});
exports.default = withPushNotifications;
