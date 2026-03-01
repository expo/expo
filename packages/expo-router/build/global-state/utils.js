"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useColorSchemeChangesIfNeeded = void 0;
exports.shouldAppendSitemap = shouldAppendSitemap;
exports.shouldAppendNotFound = shouldAppendNotFound;
exports.shouldReactToColorSchemeChanges = shouldReactToColorSchemeChanges;
exports.getRootStackRouteNames = getRootStackRouteNames;
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_native_1 = require("react-native");
const constants_1 = require("../constants");
function shouldAppendSitemap() {
    const config = expo_constants_1.default.expoConfig?.extra?.router;
    return config?.sitemap !== false;
}
function shouldAppendNotFound() {
    const config = expo_constants_1.default.expoConfig?.extra?.router;
    return config?.notFound !== false;
}
function shouldReactToColorSchemeChanges() {
    const config = expo_constants_1.default.expoConfig?.extra?.router;
    return config?.adaptiveColors !== false;
}
// TODO(@ubax): Replace this with a custom theme provider, once we can pass ColorValue objects through the React Navigation theme.
// https://linear.app/expo/issue/ENG-19168/replace-global-usecolorschme-with-a-custom-theme-provider-once-we-can
exports.useColorSchemeChangesIfNeeded = shouldReactToColorSchemeChanges()
    ? react_native_1.useColorScheme
    : function () { };
function getRootStackRouteNames() {
    const routes = [constants_1.INTERNAL_SLOT_NAME];
    if (shouldAppendNotFound()) {
        routes.push(constants_1.NOT_FOUND_ROUTE_NAME);
    }
    if (shouldAppendSitemap()) {
        routes.push(constants_1.SITEMAP_ROUTE_NAME);
    }
    return routes;
}
//# sourceMappingURL=utils.js.map