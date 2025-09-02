"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldAppendSitemap = shouldAppendSitemap;
exports.shouldAppendNotFound = shouldAppendNotFound;
exports.getRootStackRouteNames = getRootStackRouteNames;
const expo_constants_1 = __importDefault(require("expo-constants"));
const constants_1 = require("../constants");
function shouldAppendSitemap() {
    const config = expo_constants_1.default.expoConfig?.extra?.router;
    return config?.sitemap !== false;
}
function shouldAppendNotFound() {
    const config = expo_constants_1.default.expoConfig?.extra?.router;
    return config?.notFound !== false;
}
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